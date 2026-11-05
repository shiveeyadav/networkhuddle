import { createHandler } from '../../../../lib/api';
import { query } from '../../../../lib/db';
import { siteUrl } from '../../../../lib/auth';
import { HttpError, badRequest } from '../../../../lib/errors';
import { parseEventInput } from '../../../../lib/events';
import { sendMail } from '../../../../lib/mailer';
import { ukDateTime } from '../../../../lib/format';
import * as v from '../../../../lib/validate';

const ACTIONS = [{ value: 'update' }, { value: 'cancel' }, { value: 'reinstate' }];

// Admin: edit, cancel or reinstate a meeting.
export default createHandler({ admin: true }, async (req, res) => {
  const id = v.idParam(req.query.id);
  const action = v.oneOf(req.body.action, ACTIONS, { label: 'Action', required: true });

  const { rows } = await query(
    `SELECT e.id, e.slug, e.title, e.status, e.starts_at,
            (SELECT COUNT(*)::int FROM bookings b WHERE b.event_id = e.id AND b.status = 'booked') AS booked_count
       FROM events e WHERE e.id = $1`,
    [id]
  );
  const ev = rows[0];
  if (!ev) throw new HttpError(404, 'Meeting not found.');

  if (action === 'update') {
    const input = parseEventInput(req.body);
    if (input.capacity < ev.booked_count) {
      throw badRequest(`Capacity can’t be lower than the ${ev.booked_count} places already booked.`);
    }
    // The slug is kept stable so shared links keep working.
    await query(
      `UPDATE events SET
          title = $1, format = $2, theme = $3, region = $4,
          starts_at = ($5::timestamp AT TIME ZONE 'Europe/London'),
          duration_minutes = $6, venue_name = $7, venue_address = $8, online_link = $9,
          capacity = $10, description = $11, updated_at = now()
        WHERE id = $12`,
      [
        input.title,
        input.format,
        input.theme,
        input.region,
        input.startsAtLocal,
        input.durationMinutes,
        input.venueName,
        input.venueAddress,
        input.onlineLink,
        input.capacity,
        input.description,
        id,
      ]
    );
    return res.status(200).json({ ok: true, id, slug: ev.slug });
  }

  if (action === 'cancel') {
    if (ev.status === 'cancelled') throw new HttpError(409, 'This meeting is already cancelled.');
    await query(`UPDATE events SET status = 'cancelled', updated_at = now() WHERE id = $1`, [id]);

    // Let booked attendees know (only for meetings that haven't happened yet).
    if (new Date(ev.starts_at).getTime() > Date.now()) {
      const att = await query(
        `SELECT u.email, u.name FROM bookings b JOIN users u ON u.id = b.user_id
          WHERE b.event_id = $1 AND b.status = 'booked' AND u.is_suspended = FALSE`,
        [id]
      );
      for (const a of att.rows) {
        // eslint-disable-next-line no-await-in-loop
        await sendMail({
          to: a.email,
          subject: `Cancelled: ${ev.title}`,
          text:
            `Hi ${a.name},\n\n` +
            `Sorry, "${ev.title}" on ${ukDateTime(ev.starts_at)} (UK time) has been cancelled. ` +
            `If you're a visitor, this booking won't count towards your free visits.\n\n` +
            `Find another meeting: ${siteUrl()}/events\n\nNetworkHuddle`,
        });
      }
    }
    return res.status(200).json({ ok: true, id, status: 'cancelled' });
  }

  // reinstate
  if (ev.status !== 'cancelled') throw new HttpError(409, 'This meeting isn’t cancelled.');
  await query(`UPDATE events SET status = 'scheduled', updated_at = now() WHERE id = $1`, [id]);
  return res.status(200).json({ ok: true, id, status: 'scheduled' });
});
