import Link from 'next/link';
import Seo from '../components/Seo';
import EventCard from '../components/EventCard';
import { useSite } from '../components/SiteContext';
import { FREE_VISITS } from '../lib/constants';
import { withSession } from '../lib/ssr';
import { query } from '../lib/db';
import { EVENT_SELECT } from '../lib/events';
import { presentEvent } from '../lib/format';

function HuddleArt() {
  return (
    <svg className="hero-art" viewBox="0 0 400 360" role="img" aria-label="Illustration of people gathered in a huddle">
      <circle cx="200" cy="180" r="150" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 8" />
      <circle cx="150" cy="140" r="78" fill="var(--accent)" opacity="0.92" />
      <circle cx="250" cy="140" r="78" fill="var(--mustard)" opacity="0.88" />
      <circle cx="200" cy="225" r="78" fill="var(--teal)" opacity="0.88" />
      <circle cx="200" cy="168" r="26" fill="var(--paper)" />
      <circle cx="62" cy="70" r="14" fill="var(--deep)" />
      <circle cx="345" cy="88" r="10" fill="var(--accent)" />
      <circle cx="330" cy="300" r="16" fill="var(--deep)" opacity="0.8" />
      <circle cx="70" cy="290" r="9" fill="var(--teal)" />
      <path d="M200 168 L62 70 M200 168 L345 88 M200 168 L330 300 M200 168 L70 290" stroke="var(--deep)" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

export default function Home({ events, deleted }) {
  const { viewer } = useSite();
  return (
    <>
      <Seo
        title="UK business networking, online and face to face"
        description="Meet UK business owners every week at friendly online, speed and face-to-face networking meetings. Swap referrals, book 1-1s and visit up to three meetings free."
        path="/"
      />

      {deleted ? (
        <div className="container" style={{ paddingTop: 16 }}>
          <p className="alert alert-success">Your account and personal data have been deleted. Sorry to see you go.</p>
        </div>
      ) : null}

      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="eyebrow">Business networking for the UK</p>
            <h1>
              Come for the people, <em>stay for the referrals.</em>
            </h1>
            <p className="lead">
              NetworkHuddle is a membership for business owners who would rather build real relationships than
              collect business cards. Join a meeting most days of the week, online or in a room near you, and
              leave with introductions worth following up.
            </p>
            <ul className="hero-points">
              <li>Online meetings, speed networking and face-to-face breakfasts</li>
              <li>Go to any meeting in any region, not just one fixed group</li>
              <li>Your first {FREE_VISITS} meetings are free, no card needed</li>
            </ul>
            <div className="btn-row">
              {viewer ? (
                <Link href="/events" className="btn">
                  Find a meeting
                </Link>
              ) : (
                <Link href="/signup" className="btn">
                  Book a free visit
                </Link>
              )}
              <Link href="/membership" className="btn btn-secondary">
                How membership works
              </Link>
            </div>
          </div>
          <HuddleArt />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Coming up</p>
              <h2>Upcoming meetings</h2>
            </div>
            <Link href="/events">See all meetings &rarr;</Link>
          </div>
          {events.length ? (
            <div className="grid grid-2">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <p className="empty">New meetings are being scheduled. Check back soon.</p>
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2>Three steps to a warmer network</h2>
          <div className="steps">
            <div className="step">
              <h3>Visit for free</h3>
              <p>
                Create a free account and book up to {FREE_VISITS} meetings. See who you click with before you
                commit to anything.
              </p>
            </div>
            <div className="step">
              <h3>Huddle up</h3>
              <p>
                Introduce yourself, hear what everyone else does, and ask for the introduction you actually need.
                Half the time is simply getting to know each other.
              </p>
            </div>
            <div className="step">
              <h3>Follow up 1-1</h3>
              <p>
                Request a 1-1 straight from someone&rsquo;s profile. Proper conversations are where trust grows and
                referrals start to flow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Meeting formats</p>
          <h2>Pick the way you like to meet</h2>
          <div className="formats">
            <div className="format-card online">
              <h3>Online meetings</h3>
              <p>
                Video meetings throughout the week, some open to all and some themed: B2B, women in business,
                neuro-inclusive, money matters and cross-border trade.
              </p>
            </div>
            <div className="format-card speed">
              <h3>Speed networking</h3>
              <p>
                Short timed one-to-one rounds online. Meet several people in under an hour and book proper
                follow-ups with the ones that fit.
              </p>
            </div>
            <div className="format-card face2face">
              <h3>Face to face</h3>
              <p>
                Breakfast, brunch and evening meetings at venues around the UK, run by regional hosts. Same
                friendly format, plus coffee.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Ready for your first huddle?</h2>
              <p>Sign up in a minute and book a free visit. Membership can wait until you&rsquo;re sure.</p>
            </div>
            <Link href={viewer ? '/events' : '/signup'} className="btn">
              {viewer ? 'Browse meetings' : 'Create a free account'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export const getServerSideProps = withSession(async (ctx) => {
  const { rows } = await query(
    `${EVENT_SELECT} WHERE e.status = 'scheduled' AND e.starts_at > now() ORDER BY e.starts_at ASC LIMIT 6`
  );
  return { props: { events: rows.map(presentEvent), deleted: ctx.query.deleted === '1' } };
});
