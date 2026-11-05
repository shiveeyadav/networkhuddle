import { createHandler } from '../../../../lib/api';
import { withTransaction } from '../../../../lib/db';
import { HttpError } from '../../../../lib/errors';
import * as v from '../../../../lib/validate';

// Cancel the signed-in user's own booking. Allowed until the meeting starts.
// A cancelled booking no longer counts towards a visitor's free visits.
export default createHandler({ auth: true }, async (req, res, user) => {
  const id = v.idParam(req.query.id);

  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT b.id, e.starts_at <= now() AS started
         FROM bookings b
         JOIN events e ON e.id = b.event_id
        WHERE b.event_id = $1 AND b.user_id = $2 AND b.status = 'booked'
        FOR UPDATE OF b`,
      [id, user.id]
    );
    const booking = rows[0];
    if (!booking) throw new HttpError(404, 'You don’t have a booking for this meeting.');
    if (booking.started) throw new HttpError(409, 'This meeting has already started, so the booking can’t be cancelled.');
    await client.query(`UPDATE bookings SET status = 'cancelled', updated_at = now() WHERE id = $1`, [booking.id]);
  });

  return res.status(200).json({ ok: true });
});
