import Link from 'next/link';
import Seo from '../components/Seo';
import { withSession, contactEmail, legalName } from '../lib/ssr';

const UPDATED = '5 November 2026';

export default function Privacy({ contact, company }) {
  return (
    <div className="container narrow page-pad legal">
      <Seo title="Privacy notice" description="How NetworkHuddle collects, uses and protects your personal data under UK GDPR." />
      <p className="eyebrow">Legal</p>
      <h1>Privacy notice</h1>
      <p className="muted">Last updated {UPDATED}</p>

      <p>
        This notice explains what personal data NetworkHuddle collects, why, and the rights you have under the UK
        General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
      </p>

      <h2>Who we are</h2>
      <p>
        NetworkHuddle (networkhuddle.com) is operated by {company}, the data controller for the personal data described
        here. Contact us about anything in this notice at <a href={`mailto:${contact}`}>{contact}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address and a securely hashed password (we never store or
          see your actual password).
        </li>
        <li>
          <strong>Profile details you choose to add:</strong> business name, role, region, industry, website, LinkedIn
          link, photo link, bio, what you offer and who you want to meet.
        </li>
        <li>
          <strong>Activity:</strong> meetings you book or cancel, and 1-1 requests and replies, including any messages
          you write.
        </li>
        <li>
          <strong>Technical data:</strong> a session cookie that keeps you signed in, and server logs (such as IP
          address and time of request) used to keep the service secure.
        </li>
      </ul>

      <h2>How we use it and our lawful basis</h2>
      <ul>
        <li>
          <strong>To provide the service</strong> (your account, bookings, 1-1s, membership): performance of our
          contract with you.
        </li>
        <li>
          <strong>To show your profile</strong> in the member directory, on attendee lists and on a public profile page
          that search engines may index: performance of contract. You can hide your profile at any time in{' '}
          <Link href="/profile/edit">your profile settings</Link>.
        </li>
        <li>
          <strong>To send service emails</strong> such as booking confirmations, cancellations, 1-1 requests and
          password resets: performance of contract. We do not send marketing emails without your consent.
        </li>
        <li>
          <strong>To keep the service safe</strong> (rate limiting, preventing abuse, removing harmful profiles): our
          legitimate interests.
        </li>
        <li>
          <strong>To meet legal obligations</strong>, for example keeping payment records once payments are taken.
        </li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We do not sell your data. Other signed-in users can see your public profile and whether you are attending a
        meeting (unless your profile is hidden). We use trusted processors to run the service: our hosting provider
        (servers in the EU/UK) and an email delivery provider. Each processes data only on our instructions. If any
        processor transfers data outside the UK, we rely on UK adequacy regulations or the UK International Data
        Transfer Agreement/Addendum.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account data while your account is open. When you delete your account, your profile, bookings
        and 1-1s are deleted straight away from the live database; backups are overwritten within 30 days. Sign-in
        sessions expire after 30 days and password reset links after one hour. Server logs are kept for no longer than
        90 days.
      </p>

      <h2>Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>have inaccurate data corrected (most of it you can edit yourself);</li>
        <li>
          have your data erased: use <strong>Delete my account</strong> in <Link href="/settings">Settings</Link>, or
          email us;
        </li>
        <li>restrict or object to processing based on legitimate interests;</li>
        <li>receive your data in a portable format.</li>
      </ul>
      <p>
        Email <a href={`mailto:${contact}`}>{contact}</a> to use any of these rights. We will reply within one month.
        If you are unhappy with how we handle your data, you can complain to the Information Commissioner&rsquo;s
        Office (ICO) at ico.org.uk or on 0303 123 1113, though we&rsquo;d appreciate the chance to put things right
        first.
      </p>

      <h2>Cookies</h2>
      <p>
        We use one essential cookie only. See our <Link href="/cookies">cookie notice</Link>.
      </p>

      <h2>Changes</h2>
      <p>If we change this notice in a meaningful way we will update the date above and tell members by email.</p>
    </div>
  );
}

export const getServerSideProps = withSession(async () => ({ props: { contact: contactEmail(), company: legalName() } }));
