import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo from '../../../components/Seo';
import AdminNav from '../../../components/AdminNav';
import EventForm from '../../../components/EventForm';
import { postJSON } from '../../../lib/client';
import { withSession } from '../../../lib/ssr';
import { query } from '../../../lib/db';
import { EVENT_SELECT } from '../../../lib/events';
import { presentEvent, ukDateTime } from '../../../lib/format';
import * as v from '../../../lib/validate';

export default function AdminEvent({ event, initial, bookings, created }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function setStatus(action) {
    const msg =
      action === 'cancel'
        ? `Cancel "${event.title}"? Everyone booked (${event.bookedCount}) will be emailed.`
        : `Reinstate "${event.title}"?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    setError('');
    const res = await postJSON(`/api/admin/events/${event.id}`, { action });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace(router.asPath, undefined, { scroll: false });
  }

  const active = bookings.filter((b) => b.status === 'booked');
  const cancelled = bookings.filter((b) => b.status !== 'booked');

  return (
    <div className="container page-pad">
      <Seo title={`Admin: ${event.title}`} noindex />
      <p className="eyebrow">Admin</p>
      <h1>{event.title}</h1>
      <AdminNav current="" />

      {created ? <p className="alert alert-success">Meeting created.</p> : null}
      {saved ? <p className="alert alert-success">Changes saved.</p> : null}
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="event-layout">
        <div>
          <section className="card">
            <h2>Details</h2>
            <EventForm
              initial={initial}
              action={`/api/admin/events/${event.id}`}
              extraBody={{ action: 'update' }}
              submitLabel="Save changes"
              onSaved={() => {
                setSaved(true);
                router.replace(`/admin/events/${event.id}`, undefined, { scroll: false });
              }}
            />
          </section>

          <section className="card">
            <h2>
              Bookings ({active.length}/{event.capacity})
            </h2>
            {active.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Booked (UK)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.map((b) => (
                      <tr key={b.id}>
                        <td>{b.isPublic && !b.isSuspended ? <Link href={`/m/${b.slug}`}>{b.name}</Link> : b.name}</td>
                        <td>
                          <a href={`mailto:${b.email}`}>{b.email}</a>
                        </td>
                        <td>{b.isMember ? 'Member' : 'Visitor'}</td>
                        <td>{b.bookedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No one has booked yet.</p>
            )}
            {cancelled.length ? (
              <details style={{ marginTop: 16 }}>
                <summary>{cancelled.length} cancelled booking(s)</summary>
                <ul>
                  {cancelled.map((b) => (
                    <li key={b.id}>
                      {b.name} ({b.email}), cancelled {b.updatedAt}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        </div>

        <aside className="event-side">
          <section className="card">
            <h2>Status</h2>
            <p>
              {event.status === 'cancelled' ? (
                <span className="tag tag-danger">Cancelled</span>
              ) : (
                <span className="tag tag-success">Scheduled</span>
              )}
            </p>
            <p className="small">
              {event.dateLabel}, {event.timeLabel} UK time
            </p>
            <p className="small">
              <Link href={`/events/${event.slug}`}>View public page &rarr;</Link>
            </p>
            {event.status === 'cancelled' ? (
              <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={() => setStatus('reinstate')}>
                Reinstate meeting
              </button>
            ) : (
              <button type="button" className="btn btn-danger btn-small" disabled={busy} onClick={() => setStatus('cancel')}>
                Cancel meeting
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(
  async (ctx) => {
    let id;
    try {
      id = v.idParam(ctx.params.id);
    } catch (e) {
      return { notFound: true };
    }
    const { rows } = await query(
      `SELECT x.*, to_char(x.starts_at AT TIME ZONE 'Europe/London', 'YYYY-MM-DD"T"HH24:MI') AS starts_local
         FROM (${EVENT_SELECT} WHERE e.id = $1) x`,
      [id]
    );
    const row = rows[0];
    if (!row) return { notFound: true };

    const bookingsRes = await query(
      `SELECT b.id, b.status, b.created_at, b.updated_at,
              u.name, u.email, u.slug, u.is_member, u.role, u.is_public, u.is_suspended
         FROM bookings b
         JOIN users u ON u.id = b.user_id
        WHERE b.event_id = $1
        ORDER BY b.created_at ASC`,
      [id]
    );

    return {
      props: {
        created: ctx.query.created === '1',
        event: presentEvent(row),
        initial: {
          title: row.title,
          format: row.format,
          theme: row.theme,
          region: row.region || '',
          startsAtLocal: row.starts_local,
          durationMinutes: row.duration_minutes,
          capacity: row.capacity,
          venueName: row.venue_name || '',
          venueAddress: row.venue_address || '',
          onlineLink: row.online_link || '',
          description: row.description || '',
        },
        bookings: bookingsRes.rows.map((b) => ({
          id: b.id,
          status: b.status,
          name: b.name,
          email: b.email,
          slug: b.slug,
          isMember: !!b.is_member || b.role === 'admin',
          isPublic: !!b.is_public,
          isSuspended: !!b.is_suspended,
          bookedAt: ukDateTime(b.created_at),
          updatedAt: ukDateTime(b.updated_at),
        })),
      },
    };
  },
  { admin: true }
);
