import Link from 'next/link';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="container narrow page-pad center">
      <Seo title="Page not found" noindex />
      <p className="eyebrow">404</p>
      <h1>We couldn&rsquo;t find that page</h1>
      <p className="lead">It may have moved, or the meeting or profile may no longer be available.</p>
      <p>
        <Link href="/events" className="btn">
          See upcoming meetings
        </Link>
      </p>
    </div>
  );
}
