import { createHandler } from '../../../../lib/api';
import { withTransaction } from '../../../../lib/db';
import { isMemberUser, siteUrl } from '../../../../lib/auth';
import { HttpError } from '../../../../lib/errors';
import { visitsUsed } from '../../../../lib/events';
import { FREE_VISITS } from '../../../../lib/constants';
import { sendMail } from '../../../../lib/mailer';
import { ukDateTime } from '../../../../lib/format';
import * as v from '../../../../lib/validate';

// Book the signed-in user onto a meeting.
// Non-members (visitors) may hold at most FREE_VISITS bookings in total.
export default createHandler(
  { auth: true, limit: { key: 'book', max: 60, windowMs: 60 * 60 * 1000 } },
  async (req, res, user) => {
    const id = v.idParam(req.query.id);
    const member = isMemberUser(user);

    const result = await withTransaction(async (client) => {
      // Lock order: user row, then event row. Serialises a visitor's concurrent
      // bookings (free-visit limit) and everyone's bookings on this event (capacity).
      await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [user.id]);
      const { rows } = await client.query(
        `SELECT id, slug, title, format, status, starts_at, capacity, online_link, venue_name, venue_address,
                starts_at <= now() AS started
           FROM events
          WHERE id = $1
          FOR UPDATE`,
        [id]
      );
      const ev = rows[0];
      if (!ev) throw new HttpError(404, 'Meeting not found.');
      if (ev.status === 'cancelled') throw new HttpError(409, 'This meeting has been cancelled.');
      if (ev.started) throw new HttpError(409, 'This meeting has already started, so it can no longer be booked.');

      const existing = await client.query('SELECT id, status FROM bookings WHERE event_id = $1 AND user_id = $2', [
        id,
        user.id,
      ]);
      const prior = existing.rows[0];
      if (prior && prior.status === 'booked') {
        throw new HttpError(409, 'You’re already booked on this meeting.', 'ALREADY_BOOKED');
      }

      let used = 0;
      if (!member) {
        used = await visitsUsed(user.id, client);
        if (used >= FREE_VISITS) {
          throw new HttpError(
            403,
            `You’ve used all ${FREE_VISITS} free visits. Become a member to keep booking meetings.`,
            'FREE_VISITS_USED'
          );
        }
      }

      const count = await client.query(
        `SELECT COUNT(*)::int AS n FROM bookings WHERE event_id = $1 AND status = 'booked'`,
        [id]
      );
      if (count.rows[0].n >= ev.capacity) throw new HttpError(409, 'Sorry, this meeting is now fully booked.', 'FULL');

      if (prior) {
        await client.query(`UPDATE bookings SET status = 'booked', updated_at = now() WHERE id = $1`, [prior.id]);
      } else {
        await client.query(`INSERT INTO bookings (event_id, user_id) VALUES ($1, $2)`, [id, user.id]);
      }

      return { ev, visitsLeft: member ? null : Math.max(0, FREE_VISITS - used - 1) };
    });

    const { ev } = result;
    const where =
      ev.format === 'face2face'
        ? `Venue: ${ev.venue_name}, ${ev.venue_address}`
        : `Join online: ${ev.online_link || 'the link will be on the meeting page'}`;
    await sendMail({
      to: user.email,
      subject: `You're booked: ${ev.title}`,
      text:
        `Hi ${user.name},\n\n` +
        `You're booked on "${ev.title}" on ${ukDateTime(ev.starts_at)} (UK time).\n\n` +
        `${where}\n\n` +
        `Meeting details, or to cancel your place: ${siteUrl()}/events/${ev.slug}\n\n` +
        (result.visitsLeft !== null
          ? `You have ${result.visitsLeft} of ${FREE_VISITS} free visits left. See ${siteUrl()}/membership to join.\n\n`
          : '') +
        `NetworkHuddle`,
    });

    return res.status(200).json({ ok: true, visitsLeft: result.visitsLeft });
  }
);
