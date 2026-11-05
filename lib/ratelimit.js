// Simple in-memory fixed-window rate limiter (per app process).
// Good enough for a single-container deployment.
const buckets = new Map();

export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10000) {
      buckets.forEach((v, k) => {
        if (v.reset <= now) buckets.delete(k);
      });
    }
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) return real.trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}
