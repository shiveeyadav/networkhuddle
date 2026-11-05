// Pure formatting helpers (safe on server and client).
// Dates are formatted on the server and passed to pages as strings to
// avoid hydration differences between server and browser ICU data.

import { FORMATS, THEMES, REGIONS, INDUSTRIES, labelFor } from './constants';

const TZ = 'Europe/London';

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parts(value, options) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...options }).format(d);
}

export function ukDate(value) {
  return parts(value, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function ukTime(value) {
  return parts(value, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function ukDateTime(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${ukDate(d)}, ${ukTime(d)}`;
}

export function ukDay(value) {
  return parts(value, { day: 'numeric' });
}

export function ukMonthShort(value) {
  return parts(value, { month: 'short' });
}

export function ukWeekdayShort(value) {
  return parts(value, { weekday: 'short' });
}

export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function truncate(text, max) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

// Turns a DB event row into a JSON-safe object for pages.
// The online link is stripped; callers add it back only for booked attendees.
export function presentEvent(row) {
  const booked = Number(row.booked_count || 0);
  const end = toDate(row.starts_at) ? new Date(toDate(row.starts_at).getTime() + row.duration_minutes * 60000) : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    format: row.format,
    formatLabel: labelFor(FORMATS, row.format),
    theme: row.theme,
    themeLabel: labelFor(THEMES, row.theme) || 'Open to all',
    region: row.region || '',
    regionLabel: labelFor(REGIONS, row.region),
    startsAt: toDate(row.starts_at) ? toDate(row.starts_at).toISOString() : null,
    dateLabel: ukDate(row.starts_at),
    timeLabel: `${ukTime(row.starts_at)}–${ukTime(end)}`,
    dayNum: ukDay(row.starts_at),
    monthShort: ukMonthShort(row.starts_at),
    weekdayShort: ukWeekdayShort(row.starts_at),
    durationMinutes: row.duration_minutes,
    venueName: row.venue_name || '',
    venueAddress: row.venue_address || '',
    capacity: row.capacity,
    bookedCount: booked,
    seatsLeft: Math.max(0, row.capacity - booked),
    description: row.description || '',
    status: row.status,
    isPast: toDate(row.starts_at) ? toDate(row.starts_at).getTime() < Date.now() : false,
  };
}

export function presentMember(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    businessName: row.business_name || '',
    jobRole: row.job_role || '',
    region: row.region || '',
    regionLabel: labelFor(REGIONS, row.region),
    industry: row.industry || '',
    industryLabel: labelFor(INDUSTRIES, row.industry),
    website: row.website || '',
    bio: row.bio || '',
    offer: row.offer || '',
    lookingFor: row.looking_for || '',
    avatarUrl: row.avatar_url || '',
    linkedinUrl: row.linkedin_url || '',
    isMember: !!row.is_member || row.role === 'admin',
  };
}
