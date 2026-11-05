// Server-side input validation. Each helper returns a clean value or throws HttpError(400).
import { badRequest } from './errors';

// Removes control characters except newline/tab (for multi-line fields).
function clean(value, multiline) {
  const s = String(value);
  return multiline
    ? s.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ');
}

export function text(value, { label = 'Field', max = 200, required = false, multiline = false } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string' && typeof value !== 'number') throw badRequest(`${label} is invalid.`);
  const v = clean(value, multiline).trim();
  if (required && !v) throw badRequest(`${label} is required.`);
  if (v.length > max) throw badRequest(`${label} must be ${max} characters or fewer.`);
  return v;
}

export function email(value) {
  const v = text(value, { label: 'Email', max: 254, required: true }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw badRequest('Please enter a valid email address.');
  return v;
}

export function password(value, label = 'Password') {
  if (typeof value !== 'string') throw badRequest(`${label} is required.`);
  if (value.length < 8) throw badRequest(`${label} must be at least 8 characters.`);
  if (value.length > 200) throw badRequest(`${label} is too long.`);
  return value;
}

export function url(value, { label = 'URL', required = false, hostSuffix = null } = {}) {
  let v = text(value, { label, max: 500, required });
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  let parsed;
  try {
    parsed = new URL(v);
  } catch (e) {
    throw badRequest(`${label} must be a valid web address.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw badRequest(`${label} must start with http:// or https://.`);
  }
  if (!parsed.hostname.includes('.')) throw badRequest(`${label} must be a valid web address.`);
  if (hostSuffix) {
    const host = parsed.hostname.toLowerCase();
    if (host !== hostSuffix && !host.endsWith(`.${hostSuffix}`)) {
      throw badRequest(`${label} must be a ${hostSuffix} address.`);
    }
  }
  return parsed.toString();
}

export function oneOf(value, list, { label = 'Value', required = false } = {}) {
  const v = value === undefined || value === null ? '' : String(value);
  if (!v) {
    if (required) throw badRequest(`${label} is required.`);
    return '';
  }
  if (!list.some((item) => item.value === v)) throw badRequest(`${label} is invalid.`);
  return v;
}

export function int(value, { label = 'Number', min = 0, max = 1000000 } = {}) {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return n;
}

// Accepts the value of an <input type="datetime-local"> (UK local time), e.g. 2026-11-20T07:30
export function localDateTime(value, { label = 'Date and time' } = {}) {
  const v = text(value, { label, max: 25, required: true });
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(v);
  if (!m) throw badRequest(`${label} is invalid.`);
  const [, y, mo, d, h, mi] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || y < 2000 || y > 2100) {
    throw badRequest(`${label} is invalid.`);
  }
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
}

export function bool(value) {
  return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

export function idParam(value) {
  const n = Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(n) || n <= 0 || n > 2147483647) throw badRequest('Invalid id.');
  return n;
}
