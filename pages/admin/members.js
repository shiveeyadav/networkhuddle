import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo from '../../components/Seo';
import AdminNav from '../../components/AdminNav';
import { postJSON } from '../../lib/client';
import { withSession, qp } from '../../lib/ssr';
import { query, likeEscape } from '../../lib/db';
import { ukDate } from '../../lib/format';

const PAGE_SIZE = 50;
const SHOW = [
  { value: 'all', label: 'Everyone' },
  { value: 'members', label: 'Members' },
  { value: 'visitors', label: 'Visitors' },
  { value: 'suspended', label: 'Suspended' },
];

const CONFIRM = {
  member: (u) => `Mark ${u.name} as a member?`,
  unmember: (u) => `Remove membership from ${u.name}? They go back to visitor limits.`,
  suspend: (u) => `Suspend ${u.name}? Their profile is hidden and they're signed out and can't log in.`,
  unsuspend: (u) => `Unsuspend ${u.name}?`,
  delete: (u) =>
    `Permanently delete ${u.name}'s account, profile, bookings and 1-1s? This cannot be undone.`,
};

function UserRow({ u, onError }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action) {
    if (!window.confirm(CONFIRM[action](u))) return;
    setBusy(true);
    onError('');
    const res = await postJSON(`/api/admin/users/${u.id}`, { action });
    setBusy(false);
    if (!res.ok) {
      onError(res.error);
      return;
    }
    router.replace(router.asPath, undefined, { scroll: false });
  }

  return (
    <tr>
      <td>
        {u.isPublic && !u.isSuspended ? <Link href={`/m/${u.slug}`}>{u.name}</Link> : u.name}
        {u.businessName ? <div className="muted small">{u.businessName}</div> : null}
      </td>
      <td>
        <a href={`mailto:${u.email}`}>{u.email}</a>
      </td>
      <td>
        {u.isAdmin ? <span className="tag">Admin</span> : null}{' '}
        {u.isMember ? <span className="tag tag-success">Member</span> : <span className="tag">Visitor</span>}{' '}
        {u.isSuspended ? <span className="tag tag-danger">Suspended</span> : null}
        {!u.isPublic ? <div className="muted small">Hidden profile</div> : null}
      </td>
      <td className="small">
        Joined {u.joined}
        <br />
        {u.bookings} booking(s)
      </td>
      <td>
        {u.isSelf || u.isAdmin ? (
          <span className="muted small">{u.isSelf ? 'You' : 'Admin'}</span>
        ) : (
          <div className="btn-row">
            {u.isMember ? (
              <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={() => act('unmember')}>
                Unmark member
              </button>
            ) : (
              <button type="button" className="btn btn-small" disabled={busy} onClick={() => act('member')}>
                Mark member
              </button>
            )}
            {u.isSuspended ? (
              <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={() => act('unsuspend')}>
                Unsuspend
              </button>
            ) : (
              <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={() => act('suspend')}>
                Suspend
              </button>
            )}
            <button type="button" className="btn btn-danger btn-small" disabled={busy} onClick={() => act('delete')}>
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function pageHref(filters, page) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.show !== 'all') params.set('show', filters.show);
  if (page > 1) params.set('page', String(page));
  const s = params.toString();
  return `/admin/members${s ? `?${s}` : ''}`;
}

export default function AdminMembers({ users, filters, page, hasMore, total }) {
  const [error, setError] = useState('');
  return (
    <div className="container page-pad">
      <Seo title="Admin: members" noindex />
      <p className="eyebrow">Admin</p>
      <h1>Members &amp; visitors</h1>
      <AdminNav current="/admin/members" />
      <p className="muted">
        Mark someone as a member once they&rsquo;ve paid (online payments aren&rsquo;t live yet). Suspend hides an abusive
        profile and blocks log-in; delete removes the account completely.
      </p>

      <form className="filters" method="get" action="/admin/members">
        <label className="field field-search">
          <span>Search</span>
          <input type="search" name="q" defaultValue={filters.q} placeholder="Name, email or business" maxLength={100} />
        </label>
        <label className="field">
          <span>Show</span>
          <select name="show" defaultValue={filters.show}>
            {SHOW.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="btn-row">
          <button type="submit" className="btn">
            Search
          </button>
        </div>
      </form>

      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="muted small">{total} found</p>

      {users.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} u={u} onError={setError} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">No accounts match.</p>
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

export const getServerSideProps = withSession(
  async (ctx, admin) => {
    const q = qp(ctx, 'q', 100);
    const showParam = qp(ctx, 'show');
    const show = SHOW.some((s) => s.value === showParam) ? showParam : 'all';
    const page = Math.min(Math.max(Number.parseInt(qp(ctx, 'page'), 10) || 1, 1), 1000);

    const where = ['TRUE'];
    const params = [];
    if (q) {
      params.push(`%${likeEscape(q)}%`);
      const p = `$${params.length}`;
      where.push(`(u.name ILIKE ${p} OR u.email ILIKE ${p} OR u.business_name ILIKE ${p})`);
    }
    if (show === 'members') where.push(`(u.is_member = TRUE OR u.role = 'admin')`);
    if (show === 'visitors') where.push(`u.is_member = FALSE AND u.role <> 'admin'`);
    if (show === 'suspended') where.push('u.is_suspended = TRUE');
    const whereSql = where.join(' AND ');

    const countRes = await query(`SELECT COUNT(*)::int AS n FROM users u WHERE ${whereSql}`, params);
    params.push(PAGE_SIZE + 1);
    const limitIdx = params.length;
    params.push((page - 1) * PAGE_SIZE);
    const offsetIdx = params.length;
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.slug, u.business_name, u.role, u.is_member, u.is_suspended, u.is_public,
              u.created_at,
              (SELECT COUNT(*)::int FROM bookings b WHERE b.user_id = u.id AND b.status = 'booked') AS bookings
         FROM users u
        WHERE ${whereSql}
        ORDER BY u.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return {
      props: {
        users: rows.slice(0, PAGE_SIZE).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          slug: u.slug,
          businessName: u.business_name || '',
          isAdmin: u.role === 'admin',
          isMember: !!u.is_member || u.role === 'admin',
          isSuspended: !!u.is_suspended,
          isPublic: !!u.is_public,
          isSelf: u.id === admin.id,
          joined: ukDate(u.created_at),
          bookings: u.bookings,
        })),
        hasMore: rows.length > PAGE_SIZE,
        total: countRes.rows[0].n,
        page,
        filters: { q, show },
      },
    };
  },
  { admin: true }
);
