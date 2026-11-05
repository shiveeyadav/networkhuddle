import Link from 'next/link';
import Seo from '../components/Seo';
import EventCard from '../components/EventCard';
import { FREE_VISITS } from '../lib/constants';
import { withSession } from '../lib/ssr';
import { query } from '../lib/db';
import { EVENT_SELECT, visitsUsed } from '../lib/events';
import { presentEvent } from '../lib/format';
import { isMemberUser } from '../lib/auth';

export default function Dashboard({ name, slug, isMember, visits, bookings, pendingIncoming, upcomingOneToOnes, missing }) {
  const first = name.split(' ')[0];
  const visitsLeft = Math.max(0, FREE_VISITS - visits);
  return (
    <div className="container page-pad">
      <Seo title="Dashboard" noindex />
      <p className="eyebrow">{isMember ? 'Member' : 'Visitor'}</p>
      <h1>Hello, {first}</h1>

      <div className="stats">
        <div className="stat">
          <div className="stat-num">{bookings.length}</div>
          <div className="stat-label">Upcoming meetings booked</div>
        </div>
        <div className="stat">
          <div className="stat-num">{upcomingOneToOnes}</div>
          <div className="stat-label">Upcoming 1-1s</div>
        </div>
        <div className="stat">
          <div className="stat-num">{pendingIncoming}</div>
          <div className="stat-label">
            <Link href="/one-to-ones">1-1 requests waiting for you</Link>
          </div>
        </div>
        {!isMember ? (
          <div className="stat">
            <div className="stat-num">
              {visitsLeft}/{FREE_VISITS}
            </div>
            <div className="stat-label">Free visits left</div>
          </div>
        ) : null}
      </div>

      {!isMember && visitsLeft === 0 ? (
        <p className="alert alert-info">
          You&rsquo;ve used all {FREE_VISITS} free visits. <Link href="/membership">Become a member</Link> to keep
          booking meetings and to request 1-1s.
        </p>
      ) : null}

      {missing.length ? (
        <p className="alert alert-info">
          Your profile is missing: {missing.join(', ')}. A full profile gets far more 1-1 requests.{' '}
          <Link href="/profile/edit">Complete your profile</Link>
        </p>
      ) : null}

      <div className="section-head">
        <h2>Your upcoming meetings</h2>
        <Link href="/events">Find more meetings &rarr;</Link>
      </div>
      {bookings.length ? (
        <div className="grid grid-2">
          {bookings.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <p className="empty">
          Nothing booked yet. <Link href="/events">Browse upcoming meetings</Link>.
        </p>
      )}

      <div className="btn-row" style={{ marginTop: 32 }}>
        <Link href="/profile/edit" className="btn btn-secondary">
          Edit profile
        </Link>
        <Link href={`/m/${slug}`} className="btn btn-secondary">
          View public profile
        </Link>
        <Link href="/one-to-ones" className="btn btn-secondary">
          My 1-1s
        </Link>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(
  async (ctx, user) => {
    const [bookingsRes, used, pendingRes, upcomingRes] = await Promise.all([
      query(
        `${EVENT_SELECT}
          JOIN bookings mine ON mine.event_id = e.id AND mine.user_id = $1 AND mine.status = 'booked'
         WHERE e.starts_at > now() - interval '3 hours'
         ORDER BY e.starts_at ASC
         LIMIT 50`,
        [user.id]
      ),
      visitsUsed(user.id),
      query(`SELECT COUNT(*)::int AS n FROM one_to_ones WHERE recipient_id = $1 AND status = 'pending'`, [user.id]),
      query(
        `SELECT COUNT(*)::int AS n FROM one_to_ones
          WHERE (recipient_id = $1 OR requester_id = $1) AND status = 'accepted' AND proposed_at > now()`,
        [user.id]
      ),
    ]);

    const missing = [];
    if (!user.bio) missing.push('a short bio');
    if (!user.offer) missing.push('what you offer');
    if (!user.looking_for) missing.push('who you want to meet');
    if (!user.region) missing.push('your region');
    if (!user.industry) missing.push('your industry');

    return {
      props: {
        name: user.name,
        slug: user.slug,
        isMember: isMemberUser(user),
        visits: used,
        bookings: bookingsRes.rows.map(presentEvent),
        pendingIncoming: pendingRes.rows[0].n,
        upcomingOneToOnes: upcomingRes.rows[0].n,
        missing,
      },
    };
  },
  { auth: true }
);
