import Link from 'next/link';
import Seo from '../../components/Seo';
import AdminNav from '../../components/AdminNav';
import { withSession, qp } from '../../lib/ssr';
import { query } from '../../lib/db';
import { EVENT_SELECT } from '../../lib/events';
import { presentEvent } from '../../lib/format';

export default function AdminHome({ events, show, stats }) {
  return (
    <div className="container page-pad">
      <Seo title="Admin" noindex />
      <p className="eyebrow">Admin</p>
      <h1>Meetings</h1>
      <AdminNav current="/admin" />

      <div className="stats">
        <div className="stat">
          <div className="stat-num">{stats.upcoming}</div>
          <div className="stat-label">Upcoming meetings</div>
        </div>
        <div className="stat">
          <div className="stat-num">{stats.members}</div>
          <div className="stat-label">Members</div>
        </div>
        <div className="stat">
          <div className="stat-num">{stats.visitors}</div>
          <div className="stat-label">Visitor accounts</div>
        </div>
        <div className="stat">
          <div className="stat-num">{stats.bookings}</div>
          <div className="stat-label">Bookings on upcoming meetings</div>
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <Link href="/admin" className={`btn btn-small${show === 'upcoming' ? '' : ' btn-secondary'}`}>
          Upcoming
        </Link>
        <Link href="/admin?show=past" className={`btn btn-small${show === 'past' ? '' : ' btn-secondary'}`}>
          Past
        </Link>
      </div>

      {events.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When (UK)</th>
                <th>Meeting</th>
                <th>Format</th>
                <th>Booked</th>
                <th>Status</th>
                <th>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.dateLabel}
                    <br />
                    <span className="muted small">{e.timeLabel}</span>
                  </td>
                  <td>
                    <Link href={`/events/${e.slug}`}>{e.title}</Link>
                    {e.regionLabel ? <div className="muted small">{e.regionLabel}</div> : null}
                  </td>
                  <td>{e.formatLabel}</td>
                  <td>
                    {e.bookedCount}/{e.capacity}
                  </td>
                  <td>
                    {e.status === 'cancelled' ? (
                      <span className="tag tag-danger">Cancelled</span>
                    ) : (
                      <span className="tag tag-success">Scheduled</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/events/${e.id}`}>Edit &amp; bookings</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">
          No {show} meetings. <Link href="/admin/events/new">Create one</Link>.
        </p>
      )}
    </div>
  );
}

export const getServerSideProps = withSession(
  async (ctx) => {
    const show = qp(ctx, 'show') === 'past' ? 'past' : 'upcoming';
    const where = show === 'past' ? 'e.starts_at <= now()' : 'e.starts_at > now()';
    const order = show === 'past' ? 'DESC' : 'ASC';
    const [eventsRes, statsRes] = await Promise.all([
      query(`${EVENT_SELECT} WHERE ${where} ORDER BY e.starts_at ${order} LIMIT 200`),
      query(
        `SELECT
           (SELECT COUNT(*)::int FROM events WHERE status = 'scheduled' AND starts_at > now()) AS upcoming,
           (SELECT COUNT(*)::int FROM users WHERE (is_member = TRUE OR role = 'admin') AND is_suspended = FALSE) AS members,
           (SELECT COUNT(*)::int FROM users WHERE is_member = FALSE AND role <> 'admin' AND is_suspended = FALSE) AS visitors,
           (SELECT COUNT(*)::int FROM bookings b JOIN events e ON e.id = b.event_id
             WHERE b.status = 'booked' AND e.status = 'scheduled' AND e.starts_at > now()) AS bookings`
      ),
    ]);
    return { props: { events: eventsRes.rows.map(presentEvent), show, stats: statsRes.rows[0] } };
  },
  { admin: true }
);
