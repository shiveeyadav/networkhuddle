import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo from '../components/Seo';
import { REGIONS, FREE_VISITS } from '../lib/constants';
import { postJSON, safeNextClient } from '../lib/client';
import { withSession } from '../lib/ssr';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', region: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await postJSON('/api/auth/signup', form);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    const next = typeof router.query.next === 'string' ? safeNextClient(router.query.next) : '/profile/edit?welcome=1';
    window.location.href = next;
  }

  return (
    <div className="container page-pad">
      <Seo title="Create a free account" description="Create a free NetworkHuddle account and visit up to three networking meetings before you join." />
      <div className="card auth-card">
        <p className="eyebrow">Free visitor account</p>
        <h1>Join the huddle</h1>
        <p className="muted">
          Visit up to {FREE_VISITS} meetings free. No card, no commitment.
        </p>
        {error ? (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        ) : null}
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>Your name</span>
            <input type="text" autoComplete="name" value={form.name} onChange={set('name')} maxLength={80} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={form.email} onChange={set('email')} maxLength={254} required />
          </label>
          <label className="field">
            <span>
              Password <span className="hint">(at least 8 characters)</span>
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              minLength={8}
              maxLength={200}
              required
            />
          </label>
          <label className="field">
            <span>
              Business name <span className="hint">(optional)</span>
            </span>
            <input type="text" autoComplete="organization" value={form.businessName} onChange={set('businessName')} maxLength={120} />
          </label>
          <label className="field">
            <span>
              Region <span className="hint">(optional)</span>
            </span>
            <select value={form.region} onChange={set('region')}>
              <option value="">Choose a region</option>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <p className="small muted">
            By creating an account you agree to our <Link href="/terms">terms of use</Link>. We handle your data as
            described in our <Link href="/privacy">privacy notice</Link>.
          </p>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Creating account…' : 'Create free account'}
          </button>
        </form>
        <p className="small" style={{ marginTop: 16 }}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(async (ctx, user) => {
  if (user) return { redirect: { destination: '/dashboard', permanent: false } };
  return { props: {} };
});
