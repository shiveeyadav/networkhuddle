// Server-only authentication helpers.
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from './db';
import { parseCookies, serializeCookie } from './cookies';
import { slugify } from './format';

export const SESSION_COOKIE = 'nh_session';
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

export function siteUrl() {
  return (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function cookieSecure() {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  return siteUrl().startsWith('https://');
}

export function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

let dummyHashPromise = null;
export async function verifyPassword(password, hash) {
  if (!hash) {
    // Spend comparable time when the user doesn't exist (limits user enumeration by timing).
    if (!dummyHashPromise) dummyHashPromise = bcrypt.hash('not-a-real-password', BCRYPT_ROUNDS);
    await bcrypt.compare(String(password), await dummyHashPromise);
    return false;
  }
  return bcrypt.compare(String(password), hash);
}

export async function createSession(res, userId) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
    hashToken(token),
    userId,
    expires,
  ]);
  // Opportunistic cleanup of this user's expired sessions.
  await query('DELETE FROM sessions WHERE user_id = $1 AND expires_at < now()', [userId]);
  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: 'Lax',
      maxAge: SESSION_DAYS * 24 * 3600,
    })
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, '', { httpOnly: true, secure: cookieSecure(), sameSite: 'Lax', maxAge: 0 })
  );
}

export async function destroySession(req, res) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) {
    await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
  }
  clearSessionCookie(res);
}

// Returns the full user row for a valid session, or null.
export async function getUserFromRequest(req) {
  const token = parseCookies(req && req.headers ? req.headers.cookie : '')[SESSION_COOKIE];
  if (!token || token.length > 200) return null;
  const { rows } = await query(
    `SELECT u.*
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()
        AND u.is_suspended = FALSE`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

export function isMemberUser(user) {
  return !!user && (user.is_member || user.role === 'admin');
}

// Minimal, safe-to-serialise view of the signed-in user for page props.
export function toViewer(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    slug: user.slug,
    email: user.email,
    role: user.role,
    isAdmin: user.role === 'admin',
    isMember: isMemberUser(user),
    avatarUrl: user.avatar_url || '',
  };
}

export async function uniqueUserSlug(name, excludeUserId) {
  const root = slugify(name) || 'member';
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { rowCount } = await query('SELECT 1 FROM users WHERE slug = $1 AND id <> $2', [
      candidate,
      excludeUserId || 0,
    ]);
    if (rowCount === 0) return candidate;
  }
  return `${root}-${crypto.randomBytes(3).toString('hex')}`;
}
