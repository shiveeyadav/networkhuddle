export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(out, key)) return;
    try {
      out[key] = decodeURIComponent(raw);
    } catch (e) {
      out[key] = raw;
    }
  });
  return out;
}

export function serializeCookie(name, value, opts = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  segments.push(`Path=${opts.path || '/'}`);
  if (typeof opts.maxAge === 'number') {
    segments.push(`Max-Age=${Math.floor(opts.maxAge)}`);
    segments.push(`Expires=${new Date(Date.now() + opts.maxAge * 1000).toUTCString()}`);
  }
  if (opts.httpOnly) segments.push('HttpOnly');
  if (opts.secure) segments.push('Secure');
  segments.push(`SameSite=${opts.sameSite || 'Lax'}`);
  return segments.join('; ');
}
