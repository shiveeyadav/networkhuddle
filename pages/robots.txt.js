import { siteUrl } from '../lib/auth';

const DISALLOW = [
  '/api/',
  '/admin',
  '/dashboard',
  '/settings',
  '/profile/',
  '/one-to-ones',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

// Rendered entirely in getServerSideProps; the component never renders.
export default function Robots() {
  return null;
}

export async function getServerSideProps({ res }) {
  const body = ['User-agent: *', 'Allow: /', ...DISALLOW.map((p) => `Disallow: ${p}`), '', `Sitemap: ${siteUrl()}/sitemap.xml`, ''].join(
    '\n'
  );
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.write(body);
  res.end();
  return { props: {} };
}
