import { createHandler } from '../../../lib/api';
import { query } from '../../../lib/db';
import { isMemberUser, siteUrl } from '../../../lib/auth';
import { HttpError } from '../../../lib/errors';
import { sendMail } from '../../../lib/mailer';
import { ukDateTime } from '../../../lib/format';
import * as v from '../../../lib/validate';

// Request a 1-1 with another member.
export default createHandler(
  { auth: true, limit: { key: 'oto-create', max: 30, windowMs: 60 * 60 * 1000 } },
  async (req, res, user) => {
    if (!isMemberUser(user)) {
      throw new HttpError(403, 'Booking 1-1s is a member benefit. See the membership page to join.', 'MEMBERS_ONLY');
    }
    const recipientSlug = v.text(req.body.recipientSlug, { label: 'Member', max: 100, required: true });
    const proposedLocal = v.localDateTime(req.body.proposedAt, { label: 'Proposed date and time' });
    const message = v.text(req.body.message, { label: 'Message', max: 1000, required: true, multiline: true });

    const { rows: recRows } = await query(
      'SELECT id, name, email FROM users WHERE slug = $1 AND is_suspended = FALSE AND is_public = TRUE',
      [recipientSlug]
    );
    const recipient = recRows[0];
    if (!recipient) throw new HttpError(404, 'That member could not be found.');
    if (recipient.id === user.id) throw new HttpError(400, 'You can’t request a 1-1 with yourself.');

    const { rows: timeRows } = await query(
      `SELECT ($1::timestamp AT TIME ZONE 'Europe/London') AS at,
              ($1::timestamp AT TIME ZONE 'Europe/London') > now() + interval '15 minutes' AS future,
              ($1::timestamp AT TIME ZONE 'Europe/London') < now() + interval '1 year' AS within_year`,
      [proposedLocal]
    );
    if (!timeRows[0].future) throw new HttpError(400, 'Please propose a time in the future.');
    if (!timeRows[0].within_year) throw new HttpError(400, 'Please propose a time within the next year.');

    const pending = await query(
      `SELECT 1 FROM one_to_ones WHERE requester_id = $1 AND recipient_id = $2 AND status = 'pending'`,
      [user.id, recipient.id]
    );
    if (pending.rowCount > 0) {
      throw new HttpError(409, 'You already have a pending request with this member. Wait for a reply or cancel it first.');
    }

    const { rows } = await query(
      `INSERT INTO one_to_ones (requester_id, recipient_id, proposed_at, message)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, recipient.id, timeRows[0].at, message]
    );

    await sendMail({
      to: recipient.email,
      subject: `${user.name} would like a 1-1 on NetworkHuddle`,
      text:
        `Hi ${recipient.name},\n\n` +
        `${user.name}${user.business_name ? ` (${user.business_name})` : ''} has asked for a 1-1 on ${ukDateTime(timeRows[0].at)} (UK time).\n\n` +
        `Their message:\n${message}\n\n` +
        `Accept or decline here: ${siteUrl()}/one-to-ones\n\nNetworkHuddle`,
    });

    return res.status(201).json({ ok: true, id: rows[0].id });
  }
);
