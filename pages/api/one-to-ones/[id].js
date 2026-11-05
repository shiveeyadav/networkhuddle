import { createHandler } from '../../../lib/api';
import { query } from '../../../lib/db';
import { siteUrl } from '../../../lib/auth';
import { HttpError } from '../../../lib/errors';
import { sendMail } from '../../../lib/mailer';
import { ukDateTime } from '../../../lib/format';
import * as v from '../../../lib/validate';

const ACTIONS = [{ value: 'accept' }, { value: 'decline' }, { value: 'cancel' }];

// Accept / decline (recipient) or cancel (either party) a 1-1.
export default createHandler({ auth: true }, async (req, res, user) => {
  const id = v.idParam(req.query.id);
  const action = v.oneOf(req.body.action, ACTIONS, { label: 'Action', required: true });
  const note = v.text(req.body.note, { label: 'Note', max: 500, multiline: true });

  const { rows } = await query(
    `SELECT o.*, rq.name AS requester_name, rq.email AS requester_email,
            rc.name AS recipient_name, rc.email AS recipient_email
       FROM one_to_ones o
       JOIN users rq ON rq.id = o.requester_id
       JOIN users rc ON rc.id = o.recipient_id
      WHERE o.id = $1`,
    [id]
  );
  const oto = rows[0];
  if (!oto || (oto.requester_id !== user.id && oto.recipient_id !== user.id)) {
    throw new HttpError(404, '1-1 not found.');
  }
  const isRecipient = oto.recipient_id === user.id;

  let newStatus;
  if (action === 'accept' || action === 'decline') {
    if (!isRecipient) throw new HttpError(403, 'Only the person invited can accept or decline.');
    if (oto.status !== 'pending') throw new HttpError(409, 'This request has already been answered.');
    newStatus = action === 'accept' ? 'accepted' : 'declined';
  } else {
    if (oto.status !== 'pending' && oto.status !== 'accepted') {
      throw new HttpError(409, 'This 1-1 can no longer be cancelled.');
    }
    newStatus = 'cancelled';
  }

  const updated = await query(
    `UPDATE one_to_ones SET status = $1, response_note = CASE WHEN $2::text = '' THEN response_note ELSE $2::text END, updated_at = now()
      WHERE id = $3 AND status = $4`,
    [newStatus, note, id, oto.status]
  );
  if (updated.rowCount === 0) throw new HttpError(409, 'This 1-1 was updated by someone else. Please refresh.');

  const other = isRecipient
    ? { name: oto.requester_name, email: oto.requester_email }
    : { name: oto.recipient_name, email: oto.recipient_email };
  const verb = { accepted: 'accepted', declined: 'declined', cancelled: 'cancelled' }[newStatus];
  await sendMail({
    to: other.email,
    subject: `${user.name} ${verb} your 1-1`,
    text:
      `Hi ${other.name},\n\n` +
      `${user.name} has ${verb} the 1-1 proposed for ${ukDateTime(oto.proposed_at)} (UK time).` +
      `${note ? `\n\nTheir note:\n${note}` : ''}\n\n` +
      `See all your 1-1s: ${siteUrl()}/one-to-ones\n\nNetworkHuddle`,
  });

  return res.status(200).json({ ok: true, status: newStatus });
});
