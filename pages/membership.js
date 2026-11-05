import Link from 'next/link';
import Seo from '../components/Seo';
import { useSite } from '../components/SiteContext';
import { FREE_VISITS } from '../lib/constants';
import { withSession, contactEmail } from '../lib/ssr';

// Prices are intentionally not set yet: online payments are not live.
// Edit the `price` strings below once membership pricing is confirmed.
const PLANS = [
  {
    key: 'visitor',
    name: 'Visitor',
    price: 'Free',
    blurb: 'Try a few meetings and see if NetworkHuddle suits you.',
    features: [
      `Book up to ${FREE_VISITS} meetings in total`,
      'Online, speed networking and face-to-face meetings',
      'Public profile in the member directory',
      'Accept 1-1 requests from members',
    ],
  },
  {
    key: 'online',
    name: 'Online member',
    price: 'Price coming soon',
    featured: true,
    blurb: 'For people who network mostly from their desk.',
    features: [
      'Unlimited online meetings, including all themed meetings',
      'Unlimited online speed networking',
      'Request 1-1s with any member',
      'Member badge on your profile',
    ],
  },
  {
    key: 'full',
    name: 'Full member',
    price: 'Price coming soon',
    blurb: 'Everything online, plus breakfast and evening meetings around the UK.',
    features: [
      'Everything in Online member',
      'Book face-to-face meetings in any region',
      'Food and drink at venues is paid separately at the venue',
      'Meet business owners in any region, not one fixed group',
    ],
  },
];

export default function Membership({ contact }) {
  const { viewer } = useSite();
  const subject = encodeURIComponent('Joining NetworkHuddle');
  return (
    <div className="container page-pad">
      <Seo
        title="Membership"
        description={`How NetworkHuddle membership works: visit up to ${FREE_VISITS} meetings free, then join to book unlimited online and face-to-face networking meetings and request 1-1s.`}
      />
      <p className="eyebrow">Membership</p>
      <h1>Try it free, join when it works for you</h1>
      <p className="lead">
        Everyone starts as a visitor. Come to up to {FREE_VISITS} meetings, meet people, and only join once you can see
        it&rsquo;s worth your time. Members can go to any meeting, in any format, in any region.
      </p>

      {viewer && viewer.isMember ? (
        <p className="alert alert-success">You&rsquo;re a member. Thank you for being part of the huddle.</p>
      ) : null}

      <div className="placeholder-box" role="note">
        <p style={{ margin: 0 }}>
          <strong>Online payments coming soon &ndash; contact us to join.</strong> Email{' '}
          <a href={`mailto:${contact}?subject=${subject}`}>{contact}</a> with the plan you&rsquo;d like and we&rsquo;ll
          set up your membership by hand. Your account is upgraded as soon as payment is confirmed.
        </p>
      </div>

      <div className="plans">
        {PLANS.map((plan) => (
          <div key={plan.key} className={`plan${plan.featured ? ' featured' : ''}`}>
            <h2 style={{ marginTop: 0 }}>{plan.name}</h2>
            <div className="plan-price">{plan.price}</div>
            <p className="muted">{plan.blurb}</p>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {plan.key === 'visitor' ? (
              viewer ? (
                <Link href="/events" className="btn btn-secondary">
                  Book a meeting
                </Link>
              ) : (
                <Link href="/signup" className="btn btn-secondary">
                  Create a free account
                </Link>
              )
            ) : (
              <a className="btn" href={`mailto:${contact}?subject=${encodeURIComponent(`Joining NetworkHuddle: ${plan.name}`)}`}>
                Contact us to join
              </a>
            )}
          </div>
        ))}
      </div>

      <section className="section">
        <h2>Common questions</h2>
        <h3>What counts as a free visit?</h3>
        <p>
          Every meeting you book as a visitor uses one of your {FREE_VISITS} free visits. If you cancel before the
          meeting starts, or we cancel the meeting, you get that visit back.
        </p>
        <h3>Do I have to join a fixed group?</h3>
        <p>
          No. There are no fixed chapters or weekly attendance rules. Book whichever meetings suit your diary and
          meet different people each time.
        </p>
        <h3>Can I cancel membership?</h3>
        <p>
          Yes. Contact us and we&rsquo;ll stop your membership at the end of the period you&rsquo;ve paid for. You can
          delete your account at any time from <Link href="/settings">Settings</Link>.
        </p>
      </section>
    </div>
  );
}

export const getServerSideProps = withSession(async () => ({ props: { contact: contactEmail() } }));
