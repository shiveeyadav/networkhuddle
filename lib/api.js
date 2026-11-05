// Server-only wrapper for API routes: method guard, CSRF checks,
// rate limiting, auth and consistent error handling.
import { getUserFromRequest } from './auth';
import { HttpError } from './errors';
import { rateLimit, clientIp } from './ratelimit';

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) {
    // Modern browsers always send Origin on cross-site POSTs. When absent we rely
    // on SameSite=Lax cookies plus the JSON content-type requirement below.
    return true;
  }
  let originHost;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch (e) {
    return false;
  }
  const hosts = [req.headers['x-forwarded-host'], req.headers.host]
    .filter(Boolean)
    .map((h) => String(h).split(',')[0].trim().toLowerCase());
  return hosts.includes(originHost);
}

export function createHandler(options, fn) {
  const { methods = ['POST'], auth = false, admin = false, limit = null } = options || {};
  return async function handler(req, res) {
    try {
      res.setHeader('Cache-Control', 'no-store');
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));
        return res.status(405).json({ error: 'Method not allowed.' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request blocked.' });
        const ct = String(req.headers['content-type'] || '');
        if (!ct.toLowerCase().startsWith('application/json')) {
          return res.status(415).json({ error: 'Requests must be sent as JSON.' });
        }
        if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
          return res.status(400).json({ error: 'Invalid request body.' });
        }
      }
      if (limit) {
        const key = `${limit.key}:${clientIp(req)}`;
        if (!rateLimit(key, limit.max, limit.windowMs)) {
          return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
        }
      }
      const user = await getUserFromRequest(req);
      if ((auth || admin) && !user) return res.status(401).json({ error: 'Please log in first.' });
      if (admin && user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
      return await fn(req, res, user);
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      // eslint-disable-next-line no-console
      console.error('[api]', req.method, req.url, err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}
