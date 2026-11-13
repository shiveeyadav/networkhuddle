import { createHandler } from '../../../lib/api';
import { query } from '../../../lib/db';
import { randomToken, hashToken, siteUrl } from '../../../lib/auth';
import { sendMail } from '../../../lib/mailer';
import * as v from '../../../lib/validate';
import { rateLimit } from '../../../lib/ratelimit';

const RESET_TTL_MINUTES = 60;

export default createHandler({ limit: { key: 'forgot', max: 5, windowMs: 15 * 60 * 1000 } }, async (req, res) => {
  const email = v.email(req.body.email);
  const { rows } = await query('SELECT id, name FROM users WHERE email = $1 AND is_suspended = FALSE', [email]);
  const user = rows[0];

  // Per-address cap so nobody can flood one inbox with reset emails by rotating IPs.
  // The response stays the same either way, so this doesn't reveal whether the account exists.
  const underCap = rateLimit(`forgot-email:${email}`, 3, 60 * 60 * 1000);

  if (user && underCap) {
    // Invalidate older unused links for this user.
    await query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [user.id]);
    const token = randomToken();
    await query(
      `INSERT INTO password_resets (token_hash, user_id, expires_at)
       VALUES ($1, $2, now() + $3::int * interval '1 minute')`,
      [hashToken(token), user.id, RESET_TTL_MINUTES]
    );
    const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendMail({
      to: email,
      subject: 'Reset your NetworkHuddle password',
      text:
        `Hi ${user.name},\n\n` +
        `Someone (hopefully you) asked to reset the password for your NetworkHuddle account.\n\n` +
        `Choose a new password here (the link works once and expires in ${RESET_TTL_MINUTES} minutes):\n${link}\n\n` +
        `If you didn't ask for this, you can ignore this email. Your password won't change.\n\n` +
        `NetworkHuddle`,
    });
  }

  // Same response whether or not the account exists.
  return res.status(200).json({ ok: true });
});
