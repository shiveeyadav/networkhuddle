import Link from 'next/link';
import Seo from '../components/Seo';
import { FREE_VISITS } from '../lib/constants';
import { withSession, contactEmail, legalName } from '../lib/ssr';

export default function Terms({ contact, company }) {
  return (
    <div className="container narrow page-pad legal">
      <Seo title="Terms of use" description="The rules for using NetworkHuddle, the UK business networking membership." />
      <p className="eyebrow">Legal</p>
      <h1>Terms of use</h1>

      <p>
        These terms apply to everyone who uses networkhuddle.com, operated by {company}. By creating an account you
        agree to them.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You must be 18 or over and use your real name and accurate business details.</li>
        <li>Keep your password private. You are responsible for activity on your account.</li>
        <li>
          Visitors may book up to {FREE_VISITS} meetings in total. After that, membership is needed to keep booking.
        </li>
      </ul>

      <h2>Behaviour</h2>
      <ul>
        <li>Be respectful at meetings and in messages. No harassment, discrimination or abuse.</li>
        <li>No spam, unsolicited bulk messages or harvesting other members&rsquo; contact details.</li>
        <li>Don&rsquo;t post anything unlawful, misleading or that infringes someone else&rsquo;s rights.</li>
        <li>
          We may suspend or remove profiles and accounts that break these rules, without notice where needed to
          protect others.
        </li>
      </ul>

      <h2>Meetings</h2>
      <ul>
        <li>All times are UK time. Please cancel bookings you can&rsquo;t make so someone else can have the seat.</li>
        <li>Food and drink at face-to-face venues is paid to the venue unless stated otherwise.</li>
        <li>We may change or cancel meetings. We&rsquo;ll email everyone booked if we do.</li>
        <li>
          Referrals and introductions are made between members in good faith. We are not responsible for business
          agreements between members.
        </li>
      </ul>

      <h2>Membership</h2>
      <p>
        Online payments are not live yet. Membership is arranged by contacting us; the price and terms will be
        confirmed to you in writing before you pay. See <Link href="/membership">membership</Link>.
      </p>

      <h2>Liability</h2>
      <p>
        We provide the service with reasonable care and skill but can&rsquo;t guarantee it will always be available.
        Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>Contact</h2>
      <p>
        Email <a href={`mailto:${contact}`}>{contact}</a>. These terms are governed by the laws of England and Wales.
      </p>
    </div>
  );
}

export const getServerSideProps = withSession(async () => ({ props: { contact: contactEmail(), company: legalName() } }));
