import { createHandler } from '../../../lib/api';
import { query } from '../../../lib/db';
import { verifyPassword, clearSessionCookie } from '../../../lib/auth';
import { HttpError } from '../../../lib/errors';

// Permanently deletes the signed-in user's account and personal data
// (profile, sessions, bookings, 1-1s, reset tokens cascade).
export default createHandler(
  { auth: true, limit: { key: 'account-delete', max: 10, windowMs: 15 * 60 * 1000 } },
  async (req, res, user) => {
    const password = typeof req.body.password === 'string' ? req.body.password.slice(0, 200) : '';
    if (!password) throw new HttpError(400, 'Please enter your password to confirm.');
    if (req.body.confirm !== true) throw new HttpError(400, 'Please tick the box to confirm you want to delete your account.');

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) throw new HttpError(401, 'That password isn’t right.');

    if (user.role === 'admin') {
      const admins = await query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND id <> $1`, [user.id]);
      if (admins.rows[0].n === 0) {
        throw new HttpError(409, 'You’re the only admin. Make someone else an admin before deleting this account.');
      }
    }

    await query('DELETE FROM users WHERE id = $1', [user.id]);
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }
);
