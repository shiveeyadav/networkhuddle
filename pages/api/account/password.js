import { createHandler } from '../../../lib/api';
import { query } from '../../../lib/db';
import { verifyPassword, hashPassword, createSession } from '../../../lib/auth';
import { HttpError } from '../../../lib/errors';
import * as v from '../../../lib/validate';

// Change password. Signs out every other session, keeps this browser signed in.
export default createHandler(
  { auth: true, limit: { key: 'account-password', max: 10, windowMs: 15 * 60 * 1000 } },
  async (req, res, user) => {
    const current = typeof req.body.currentPassword === 'string' ? req.body.currentPassword.slice(0, 200) : '';
    const next = v.password(req.body.newPassword, 'New password');
    if (!(await verifyPassword(current, user.password_hash))) {
      throw new HttpError(401, 'Your current password isn’t right.');
    }
    const hash = await hashPassword(next);
    await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hash, user.id]);
    await query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
    await createSession(res, user.id);
    return res.status(200).json({ ok: true });
  }
);
