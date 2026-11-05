import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSite } from './SiteContext';
import CookieNotice from './CookieNotice';
import { postJSON } from '../lib/client';

function Logo() {
  return (
    <Link href="/" className="logo" aria-label="NetworkHuddle home">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <circle cx="12" cy="13" r="8" fill="var(--accent)" />
        <circle cx="22" cy="13" r="8" fill="var(--mustard)" opacity="0.9" />
        <circle cx="17" cy="21" r="8" fill="var(--teal)" opacity="0.9" />
      </svg>
      <span>
        Network<strong>Huddle</strong>
      </span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { viewer } = useSite();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  async function logout() {
    await postJSON('/api/auth/logout', {});
    window.location.href = '/';
  }

  const isActive = (href) => (router.pathname === href || router.pathname.startsWith(`${href}/`) ? 'active' : undefined);

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <nav id="site-nav" className={`site-nav${menuOpen ? ' open' : ''}`} aria-label="Main">
            <Link href="/events" className={isActive('/events')}>
              Meetings
            </Link>
            <Link href="/members" className={isActive('/members')}>
              Members
            </Link>
            <Link href="/membership" className={isActive('/membership')}>
              Membership
            </Link>
            {viewer ? (
              <>
                <Link href="/dashboard" className={isActive('/dashboard')}>
                  Dashboard
                </Link>
                <Link href="/one-to-ones" className={isActive('/one-to-ones')}>
                  My 1-1s
                </Link>
                {viewer.isAdmin ? (
                  <Link href="/admin" className={isActive('/admin')}>
                    Admin
                  </Link>
                ) : null}
                <Link href="/settings" className={isActive('/settings')}>
                  Settings
                </Link>
                <button type="button" className="nav-button" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={isActive('/login')}>
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-small">
                  Visit free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="site-main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <Logo />
            <p className="footer-blurb">
              Friendly business networking across the UK. Online every weekday, face to face in towns and cities near you.
            </p>
          </div>
          <div className="footer-links">
            <h4>Network</h4>
            <Link href="/events">Upcoming meetings</Link>
            <Link href="/members">Member directory</Link>
            <Link href="/membership">Membership</Link>
          </div>
          <div className="footer-links">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy notice</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/terms">Terms of use</Link>
          </div>
        </div>
        <div className="container footer-base">
          <p>&copy; NetworkHuddle. All meeting times are UK time (Europe/London).</p>
        </div>
      </footer>
      <CookieNotice />
    </div>
  );
}
