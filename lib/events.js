// Server-only event helpers.
import { query } from './db';
import { FORMATS, THEMES, REGIONS, FREE_VISITS } from './constants';
import * as v from './validate';
import { badRequest } from './errors';
import { slugify } from './format';

export const EVENT_SELECT = `
  SELECT e.*,
         COALESCE(bc.cnt, 0)::int AS booked_count
    FROM events e
    LEFT JOIN (
      SELECT event_id, COUNT(*) AS cnt FROM bookings WHERE status = 'booked' GROUP BY event_id
    ) bc ON bc.event_id = e.id
`;

// Number of free visits a non-member has used: bookings that are still
// active on events that weren't cancelled by us.
export async function visitsUsed(userId, client) {
  const runner = client || { query };
  const { rows } = await runner.query(
    `SELECT COUNT(*)::int AS n
       FROM bookings b
       JOIN events e ON e.id = b.event_id
      WHERE b.user_id = $1 AND b.status = 'booked' AND e.status <> 'cancelled'`,
    [userId]
  );
  return rows[0].n;
}

export function visitsLeft(used) {
  return Math.max(0, FREE_VISITS - used);
}

export async function uniqueEventSlug(title, localDate, excludeId) {
  const root = `${slugify(title) || 'event'}-${localDate}`.slice(0, 80);
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { rowCount } = await query('SELECT 1 FROM events WHERE slug = $1 AND id <> $2', [candidate, excludeId || 0]);
    if (rowCount === 0) return candidate;
  }
  return `${root}-${Date.now()}`;
}

// Validates admin event form input.
export function parseEventInput(body) {
  const title = v.text(body.title, { label: 'Title', max: 120, required: true });
  const format = v.oneOf(body.format, FORMATS, { label: 'Format', required: true });
  const theme = v.oneOf(body.theme, THEMES, { label: 'Theme' }) || 'general';
  const region = v.oneOf(body.region, REGIONS, { label: 'Region' });
  const startsAtLocal = v.localDateTime(body.startsAtLocal, { label: 'Start date and time' });
  const durationMinutes = v.int(body.durationMinutes, { label: 'Duration (minutes)', min: 10, max: 600 });
  const capacity = v.int(body.capacity, { label: 'Capacity', min: 1, max: 1000 });
  const venueName = v.text(body.venueName, { label: 'Venue name', max: 150 });
  const venueAddress = v.text(body.venueAddress, { label: 'Venue address', max: 300 });
  const onlineLink = v.url(body.onlineLink, { label: 'Online meeting link' });
  const description = v.text(body.description, { label: 'Description', max: 5000, multiline: true });

  if (format === 'face2face') {
    if (!region) throw badRequest('Face-to-face meetings need a region.');
    if (!venueName || !venueAddress) throw badRequest('Face-to-face meetings need a venue name and address.');
  } else if (!onlineLink) {
    throw badRequest('Online and speed networking meetings need a meeting link.');
  }

  return {
    title,
    format,
    theme,
    region,
    startsAtLocal,
    durationMinutes,
    capacity,
    venueName: format === 'face2face' ? venueName : '',
    venueAddress: format === 'face2face' ? venueAddress : '',
    onlineLink: format === 'face2face' ? '' : onlineLink,
    description,
  };
}

// Resolves an /events/[id] route param, which may be a numeric id or a slug.
// Returns { row, byId } or null.
export async function findEventByParam(param) {
  const p = String(param || '').slice(0, 120);
  const byId = /^\d{1,9}$/.test(p);
  if (!byId && !/^[a-z0-9-]+$/.test(p)) return null;
  const { rows } = await query(`${EVENT_SELECT} WHERE ${byId ? 'e.id = $1' : 'e.slug = $1'}`, [byId ? Number(p) : p]);
  return rows[0] ? { row: rows[0], byId } : null;
}

// Validates a YYYY-MM-DD date string (used by the events date filters).
export function isIsoDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
