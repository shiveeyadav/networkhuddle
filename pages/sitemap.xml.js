import { query } from '../lib/db';
import { siteUrl } from '../lib/auth';

const STATIC_PATHS = ['/', '/events', '/members', '/membership', '/privacy', '/cookies', '/terms'];

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod) {
  return `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`;
}

// Rendered entirely in getServerSideProps; the component never renders.
export default function Sitemap() {
  return null;
}

export async function getServerSideProps({ res }) {
  const base = siteUrl();
  const [events, members] = await Promise.all([
    query(
      `SELECT slug, updated_at FROM events
        WHERE status = 'scheduled' AND starts_at > now()
        ORDER BY starts_at ASC LIMIT 5000`
    ),
    query(
      `SELECT slug, updated_at FROM users
        WHERE is_public = TRUE AND is_suspended = FALSE AND bio <> ''
        ORDER BY updated_at DESC LIMIT 40000`
    ),
  ]);

  const lines = [
    ...STATIC_PATHS.map((p) => urlEntry(`${base}${p === '/' ? '' : p}`)),
    ...events.rows.map((r) => urlEntry(`${base}/events/${r.slug}`, r.updated_at)),
    ...members.rows.map((r) => urlEntry(`${base}/m/${r.slug}`, r.updated_at)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.write(xml);
  res.end();
  return { props: {} };
}
