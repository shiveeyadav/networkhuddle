import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'nh_cookie_notice_seen';

// Informational notice only: the site sets a single essential session cookie,
// so no consent choice is needed. Dismissal is remembered in localStorage.
export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch (e) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {
      // storage unavailable; just hide for this page view
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie notice">
      <p>
        We only use one essential cookie, to keep you signed in. No tracking or advertising cookies.{' '}
        <Link href="/cookies">More about cookies</Link>
      </p>
      <button type="button" className="btn btn-small" onClick={dismiss}>
        OK, got it
      </button>
    </div>
  );
}
