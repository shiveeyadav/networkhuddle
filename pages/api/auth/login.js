import { createHandler } from '../../../lib/api';
import { query } from '../../../lib/db';
import { verifyPassword, createSession } from '../../../lib/auth';
import { HttpError } from '../../../lib/errors';
import { rateLimit } from '../../../lib/ratelimit';
import * as v from '../../../lib/validate';

export default createHandler({ limit: { key: 'login', max: 20, windowMs: 15 * 60 * 1000 } }, async (req, res) => {
  const email = v.email(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password.slice(0, 200) : '';
  if (!password) throw new HttpError(400, 'Please enter your password.');
  // Per-account limit on top of the per-IP one: stops password guessing
  // against a single account from many different IPs.
  if (!rateLimit(`login-email:${email}`, 10, 15 * 60 * 1000)) {
    throw new HttpError(429, 'Too many attempts for this account. Please wait 15 minutes or reset your password.');
  }

  const { rows } = await query('SELECT id, password_hash, is_suspended FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const ok = await verifyPassword(password, user ? user.password_hash : null);
  if (!user || !ok) throw new HttpError(401, 'That email and password don’t match an account.');
  if (user.is_suspended) throw new HttpError(403, 'This account has been suspended. Please contact us if you think this is a mistake.');

  await createSession(res, user.id);
  return res.status(200).json({ ok: true });
});
