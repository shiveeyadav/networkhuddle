import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo from '../../components/Seo';
import Avatar from '../../components/Avatar';
import { FormatBadge } from '../../components/EventCard';
import { useSite } from '../../components/SiteContext';
import { FREE_VISITS } from '../../lib/constants';
import { postJSON } from '../../lib/client';
import { withSession } from '../../lib/ssr';
import { query } from '../../lib/db';
import { findEventByParam, visitsUsed } from '../../lib/events';
import { presentEvent, truncate } from '../../lib/format';
import { isMemberUser } from '../../lib/auth';

function BookingBox({ event, booking }) {
  const { viewer } = useSite();
  const router = useRouter();
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function call(action) {
    if (action === 'cancel' && !window.confirm('Cancel your place at this meeting?')) return;
    setBusy(true);
    setError('');
    setErrorCode('');
    const res = await postJSON(`/api/events/${event.id}/${action}`, {});
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setErrorCode(res.code || '');
      return;
    }
    router.replace(router.asPath, undefined, { scroll: false });
  }

  const here = `/events/${event.slug}`;

  if (event.status === 'cancelled') {
    return <p className="alert alert-error">This meeting has been cancelled.</p>;
  }
  if (event.isPast) {
    return <p className="muted">This meeting has already taken place.</p>;
  }

  if (!viewer) {
    return (
      <>
        <p>
          {event.seatsLeft > 0 ? `${event.seatsLeft} of ${event.capacity} seats left.` : 'This meeting is fully booked.'}
        </p>
        <p>
          <Link className="btn" href={`/signup?next=${encodeURIComponent(here)}`}>
            Create a free account to book
          </Link>
        </p>
        <p className="small">
          Already have an account? <Link href={`/login?next=${encodeURIComponent(here)}`}>Log in</Link>. Visitors can
          attend up to {FREE_VISITS} meetings free.
        </p>
      </>
    );
  }

  const outOfVisits = !viewer.isMember && booking.visitsLeft <= 0;

  return (
    <>
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
          {errorCode === 'FREE_VISITS_USED' ? (
            <>
              {' '}
              <Link href="/membership">See membership</Link>
            </>
          ) : null}
        </p>
      ) : null}

      {booking.isBooked ? (
        <>
          <p className="alert alert-success">You&rsquo;re booked on this meeting.</p>
          <button type="button" className="btn btn-danger btn-small" disabled={busy} onClick={() => call('cancel')}>
            {busy ? 'Cancelling…' : 'Cancel my place'}
          </button>
        </>
      ) : outOfVisits ? (
        <div className="alert alert-info">
          <p style={{ marginTop: 0 }}>
            <strong>You&rsquo;ve used all {FREE_VISITS} free visits.</strong>
          </p>
          <p>Become a member to keep booking meetings, request 1-1s and get the most out of NetworkHuddle.</p>
          <Link className="btn btn-small" href="/membership">
            Become a member
          </Link>
        </div>
      ) : event.seatsLeft <= 0 ? (
        <p className="alert alert-info">This meeting is fully booked. Check other dates on the meetings page.</p>
      ) : (
        <>
          <p>
            {event.seatsLeft} of {event.capacity} seats left.
          </p>
          {!viewer.isMember ? (
            <p className="small muted">
              Booking uses 1 of your free visits ({booking.visitsLeft} of {FREE_VISITS} left).
            </p>
          ) : null}
          <button type="button" className="btn" disabled={busy} onClick={() => call('book')}>
            {busy ? 'Booking…' : 'Book my place'}
          </button>
        </>
      )}
    </>
  );
}

export default function EventPage({ event, booking, onlineLink, attendees }) {
  const { viewer } = useSite();
  const isF2F = event.format === 'face2face';
  const description = truncate(
    `${event.formatLabel} on ${event.dateLabel}, ${event.timeLabel} UK time${isF2F && event.regionLabel ? ` in ${event.regionLabel}` : ''}. ${event.description}`,
    155
  );

  return (
    <div className="container page-pad">
      <Seo title={`${event.title} - ${event.dateLabel}`} description={description} path={`/events/${event.slug}`} noindex={event.status === 'cancelled'} />
      <p className="small">
        <Link href="/events">&larr; All meetings</Link>
      </p>
      <div className="event-card-tags">
        <FormatBadge format={event.format} label={event.formatLabel} />
        {event.theme !== 'general' ? <span className="tag">{event.themeLabel}</span> : null}
        {event.status === 'cancelled' ? <span className="tag tag-danger">Cancelled</span> : null}
      </div>
      <h1>{event.title}</h1>

      <div className="event-layout">
        <div>
          <section className="card">
            <dl className="kv">
              <dt>Date</dt>
              <dd>{event.dateLabel}</dd>
              <dt>Time</dt>
              <dd>{event.timeLabel} UK time</dd>
              <dt>Where</dt>
              <dd>
                {isF2F ? (
                  <>
                    <strong>{event.venueName}</strong>
                    <br />
                    {event.venueAddress}
                    {event.regionLabel ? (
                      <>
                        <br />
                        <span className="muted">{event.regionLabel}</span>
                      </>
                    ) : null}
                  </>
                ) : onlineLink ? (
                  <>
                    Online
                    <div className="meeting-link">
                      <a href={onlineLink} target="_blank" rel="noopener noreferrer">
                        {onlineLink}
                      </a>
                    </div>
                  </>
                ) : (
                  'Online (link shown after booking)'
                )}
              </dd>
              <dt>Capacity</dt>
              <dd>
                {event.capacity} places, {event.seatsLeft} left
              </dd>
            </dl>
          </section>

          {event.description ? (
            <section className="card">
              <h2>About this meeting</h2>
              <p className="prose">{event.description}</p>
            </section>
          ) : null}

          {viewer && attendees.length ? (
            <section className="card">
              <h2>Who&rsquo;s going</h2>
              <ul className="attendees">
                {attendees.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/m/${a.slug}`}>
                      <Avatar name={a.name} url={a.avatarUrl} size={28} />
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="small muted">Only attendees with a public profile are listed.</p>
            </section>
          ) : null}
        </div>

        <aside className="event-side">
          <section className="card">
            <h2>Your place</h2>
            <BookingBox event={event} booking={booking} />
          </section>
          {viewer && viewer.isAdmin ? (
            <p className="small">
              <Link href={`/admin/events/${event.id}`}>Manage this meeting (admin)</Link>
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(async (ctx, user) => {
  const found = await findEventByParam(ctx.params.id);
  if (!found) return { notFound: true };
  const { row, byId } = found;
  if (byId) return { redirect: { destination: `/events/${row.slug}`, permanent: false } };

  let isBooked = false;
  let visitsLeft = FREE_VISITS;
  let attendees = [];
  if (user) {
    const [mine, used, att] = await Promise.all([
      query(`SELECT 1 FROM bookings WHERE event_id = $1 AND user_id = $2 AND status = 'booked'`, [row.id, user.id]),
      visitsUsed(user.id),
      query(
        `SELECT u.slug, u.name, u.avatar_url
           FROM bookings b
           JOIN users u ON u.id = b.user_id
          WHERE b.event_id = $1 AND b.status = 'booked' AND u.is_public = TRUE AND u.is_suspended = FALSE
          ORDER BY b.created_at ASC
          LIMIT 200`,
        [row.id]
      ),
    ]);
    isBooked = mine.rowCount > 0;
    visitsLeft = Math.max(0, FREE_VISITS - used);
    attendees = att.rows.map((a) => ({ slug: a.slug, name: a.name, avatarUrl: a.avatar_url || '' }));
    ctx.res.setHeader('Cache-Control', 'private, no-store');
  }

  // The online link is only revealed to booked attendees (and admins).
  const canSeeLink = row.format !== 'face2face' && (isBooked || (user && user.role === 'admin'));

  return {
    props: {
      event: presentEvent(row),
      booking: { isBooked, visitsLeft, isMember: isMemberUser(user) },
      onlineLink: canSeeLink ? row.online_link || '' : '',
      attendees,
    },
  };
});
