// Server-only helpers for getServerSideProps.
import { getUserFromRequest, toViewer, siteUrl } from './auth';

export function serialize(value) {
  return JSON.parse(JSON.stringify(value === undefined ? null : value));
}

export function contactEmail() {
  return process.env.CONTACT_EMAIL || 'hello@networkhuddle.com';
}

// Legal name of the business operating the site (data controller), shown on legal pages.
export function legalName() {
  return process.env.LEGAL_NAME || 'NetworkHuddle';
}

// Wraps getServerSideProps: loads the signed-in user, enforces auth/admin,
// and adds { viewer, siteUrl } to every page's props.
export function withSession(handler, { auth = false, admin = false } = {}) {
  return async function getServerSideProps(ctx) {
    const user = await getUserFromRequest(ctx.req);
    if ((auth || admin) && !user) {
      return {
        redirect: { destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl || '/')}`, permanent: false },
      };
    }
    if (admin && user.role !== 'admin') return { notFound: true };
    if (auth || admin) ctx.res.setHeader('Cache-Control', 'private, no-store');

    const base = { viewer: toViewer(user), siteUrl: siteUrl() };
    if (!handler) return { props: base };
    const result = await handler(ctx, user);
    if (!result) return { props: base };
    if (result.props) return { ...result, props: { ...base, ...serialize(result.props) } };
    return result;
  };
}

// Reads a single string query parameter.
export function qp(ctx, key, max = 100) {
  const v = ctx.query[key];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' ? s.trim().slice(0, max) : '';
}

// Safe internal redirect target (prevents open redirects).
export function safeNext(next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/dashboard';
  return next;
}
