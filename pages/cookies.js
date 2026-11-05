import Link from 'next/link';
import Seo from '../components/Seo';
import { withSession, contactEmail } from '../lib/ssr';

export default function Cookies({ contact }) {
  return (
    <div className="container narrow page-pad legal">
      <Seo title="Cookie notice" description="NetworkHuddle uses a single essential cookie to keep you signed in, and no tracking or advertising cookies." />
      <p className="eyebrow">Legal</p>
      <h1>Cookie notice</h1>

      <p>
        NetworkHuddle uses <strong>essential cookies only</strong>. We do not use analytics, advertising, social media
        or any other tracking cookies, so we don&rsquo;t need to ask for your consent under the Privacy and Electronic
        Communications Regulations (PECR).
      </p>

      <h2>Cookies we set</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Purpose</th>
              <th>Lasts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>nh_session</code>
              </td>
              <td>
                Keeps you signed in after you log in. It holds a random identifier only. It is marked HttpOnly (not
                readable by scripts), Secure and SameSite=Lax.
              </td>
              <td>30 days, or until you log out</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Local storage</h2>
      <p>
        When you close the cookie banner we remember that in your browser&rsquo;s local storage (key{' '}
        <code>nh_cookie_notice_seen</code>) so it doesn&rsquo;t keep reappearing. It is never sent to our servers.
      </p>

      <h2>Third-party content</h2>
      <p>
        Member profile photos are loaded from links that members provide. Online meeting links take you to a separate
        video service, which has its own cookie and privacy policies.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can block or delete cookies in your browser settings, but you won&rsquo;t be able to log in without the
        session cookie.
      </p>

      <p>
        Questions? Email <a href={`mailto:${contact}`}>{contact}</a>, or read our <Link href="/privacy">privacy notice</Link>.
      </p>
    </div>
  );
}

export const getServerSideProps = withSession(async () => ({ props: { contact: contactEmail() } }));
