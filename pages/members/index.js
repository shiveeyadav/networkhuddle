import Link from 'next/link';
import Seo from '../../components/Seo';
import MemberCard from '../../components/MemberCard';
import { REGIONS, INDUSTRIES, labelFor } from '../../lib/constants';
import { withSession, qp } from '../../lib/ssr';
import { query, likeEscape } from '../../lib/db';
import { presentMember } from '../../lib/format';

const PAGE_SIZE = 30;

function pageHref(filters, page) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.region) params.set('region', filters.region);
  if (filters.industry) params.set('industry', filters.industry);
  if (page > 1) params.set('page', String(page));
  const s = params.toString();
  return `/members${s ? `?${s}` : ''}`;
}

export default function Members({ members, filters, page, hasMore, total }) {
  const regionLabel = labelFor(REGIONS, filters.region);
  const title = regionLabel ? `Business networking members in ${regionLabel}` : 'Member directory';
  return (
    <div className="container page-pad">
      <Seo
        title={title}
        description="Search the NetworkHuddle directory for UK business owners by name, business, region, industry or what they offer."
        noindex={!!filters.q || page > 1}
      />
      <p className="eyebrow">Directory</p>
      <h1>{title}</h1>
      <p className="lead">Find people by what they do, where they are, or what they can help with.</p>

      <form className="filters" method="get" action="/members">
        <label className="field field-search">
          <span>Search</span>
          <input type="search" name="q" defaultValue={filters.q} placeholder="Name, business or service" maxLength={100} />
        </label>
        <label className="field">
          <span>Region</span>
          <select name="region" defaultValue={filters.region}>
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Industry</span>
          <select name="industry" defaultValue={filters.industry}>
            <option value="">All industries</option>
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <div className="btn-row">
          <button type="submit" className="btn">
            Search
          </button>
          {filters.q || filters.region || filters.industry ? <Link href="/members">Clear</Link> : null}
        </div>
      </form>

      <p className="muted small">
        {total} {total === 1 ? 'person' : 'people'} found
      </p>

      {members.length ? (
        <div className="grid grid-2">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      ) : (
        <p className="empty">
          No one matches those filters yet. Try a broader search, or <Link href="/signup">join</Link> and be the
          first.
        </p>
      )}

      {page > 1 || hasMore ? (
        <nav className="pagination" aria-label="Pages">
          {page > 1 ? (
            <Link className="btn btn-secondary btn-small" href={pageHref(filters, page - 1)}>
              &larr; Previous
            </Link>
          ) : null}
          {hasMore ? (
            <Link className="btn btn-secondary btn-small" href={pageHref(filters, page + 1)}>
              Next &rarr;
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

export const getServerSideProps = withSession(async (ctx) => {
  const q = qp(ctx, 'q', 100);
  const region = REGIONS.some((r) => r.value === qp(ctx, 'region')) ? qp(ctx, 'region') : '';
  const industry = INDUSTRIES.some((i) => i.value === qp(ctx, 'industry')) ? qp(ctx, 'industry') : '';
  const page = Math.min(Math.max(Number.parseInt(qp(ctx, 'page'), 10) || 1, 1), 1000);

  const where = ['u.is_suspended = FALSE', 'u.is_public = TRUE'];
  const params = [];
  if (q) {
    params.push(`%${likeEscape(q)}%`);
    const p = `$${params.length}`;
    where.push(`(u.name ILIKE ${p} OR u.business_name ILIKE ${p} OR u.offer ILIKE ${p} OR u.job_role ILIKE ${p})`);
  }
  if (region) {
    params.push(region);
    where.push(`u.region = $${params.length}`);
  }
  if (industry) {
    params.push(industry);
    where.push(`u.industry = $${params.length}`);
  }
  const whereSql = where.join(' AND ');

  const countRes = await query(`SELECT COUNT(*)::int AS n FROM users u WHERE ${whereSql}`, params);
  params.push(PAGE_SIZE + 1);
  const limitIdx = params.length;
  params.push((page - 1) * PAGE_SIZE);
  const offsetIdx = params.length;
  const { rows } = await query(
    `SELECT u.id, u.slug, u.name, u.business_name, u.job_role, u.region, u.industry, u.offer,
            u.avatar_url, u.is_member, u.role, u.website, u.bio, u.looking_for, u.linkedin_url
       FROM users u
      WHERE ${whereSql}
      ORDER BY (u.bio <> '') DESC, u.is_member DESC, u.name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return {
    props: {
      members: rows.slice(0, PAGE_SIZE).map(presentMember),
      hasMore: rows.length > PAGE_SIZE,
      total: countRes.rows[0].n,
      page,
      filters: { q, region, industry },
    },
  };
});
