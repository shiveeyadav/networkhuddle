import { createHandler } from '../../../lib/api';
import { query } from '../../../lib/db';
import { hashPassword, createSession, uniqueUserSlug } from '../../../lib/auth';
import { HttpError } from '../../../lib/errors';
import { REGIONS } from '../../../lib/constants';
import * as v from '../../../lib/validate';

export default createHandler({ limit: { key: 'signup', max: 10, windowMs: 60 * 60 * 1000 } }, async (req, res) => {
  const b = req.body;
  const name = v.text(b.name, { label: 'Name', max: 80, required: true });
  const email = v.email(b.email);
  const password = v.password(b.password);
  const businessName = v.text(b.businessName, { label: 'Business name', max: 120 });
  const region = v.oneOf(b.region, REGIONS, { label: 'Region' });

  const existing = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw new HttpError(409, 'An account with this email already exists. Try logging in instead.');
  }

  const hash = await hashPassword(password);
  const slug = await uniqueUserSlug(name);
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, name, slug, business_name, region)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [email, hash, name, slug, businessName, region]
  );
  if (!rows[0]) throw new HttpError(409, 'An account with this email already exists. Try logging in instead.');

  await createSession(res, rows[0].id);
  return res.status(201).json({ ok: true });
});
