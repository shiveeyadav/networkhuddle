import { createHandler } from '../../../lib/api';
import { withTransaction } from '../../../lib/db';
import { hashToken, hashPassword } from '../../../lib/auth';
import { HttpError } from '../../../lib/errors';
import * as v from '../../../lib/validate';

export default createHandler({ limit: { key: 'reset', max: 10, windowMs: 15 * 60 * 1000 } }, async (req, res) => {
  const token = v.text(req.body.token, { label: 'Reset link', max: 200, required: true });
  const password = v.password(req.body.password, 'New password');
  const newHash = await hashPassword(password);

  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT pr.user_id
         FROM password_resets pr
         JOIN users u ON u.id = pr.user_id
        WHERE pr.token_hash = $1
          AND pr.used_at IS NULL
          AND pr.expires_at > now()
          AND u.is_suspended = FALSE
        FOR UPDATE OF pr`,
      [hashToken(token)]
    );
    if (!rows[0]) {
      throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');
    }
    const userId = rows[0].user_id;
    await client.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [newHash, userId]);
    await client.query('UPDATE password_resets SET used_at = now() WHERE token_hash = $1', [hashToken(token)]);
    // Sign out everywhere after a password reset.
    await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  });

  return res.status(200).json({ ok: true });
});
