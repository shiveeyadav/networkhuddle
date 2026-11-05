import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo from '../components/Seo';
import { postJSON, safeNextClient } from '../lib/client';
import { withSession, safeNext } from '../lib/ssr';

export default function Login({ reset }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await postJSON('/api/auth/login', { email, password });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    window.location.href = safeNextClient(typeof router.query.next === 'string' ? router.query.next : '/dashboard');
  }

  const nextParam = typeof router.query.next === 'string' ? `?next=${encodeURIComponent(router.query.next)}` : '';

  return (
    <div className="container page-pad">
      <Seo title="Log in" noindex />
      <div className="card auth-card">
        <h1>Welcome back</h1>
        {reset ? <p className="alert alert-success">Your password has been changed. Please log in.</p> : null}
        {error ? (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        ) : null}
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="small" style={{ marginTop: 16 }}>
          <Link href="/forgot-password">Forgotten your password?</Link>
          <br />
          New here? <Link href={`/signup${nextParam}`}>Create a free account</Link>
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(async (ctx, user) => {
  if (user) {
    const next = typeof ctx.query.next === 'string' ? ctx.query.next : '/dashboard';
    return { redirect: { destination: safeNext(next), permanent: false } };
  }
  return { props: { reset: ctx.query.reset === '1' } };
});
