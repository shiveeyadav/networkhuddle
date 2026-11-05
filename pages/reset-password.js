import { useState } from 'react';
import Link from 'next/link';
import Seo from '../components/Seo';
import { postJSON } from '../lib/client';
import { withSession, qp } from '../lib/ssr';

export default function ResetPassword({ token }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await postJSON('/api/auth/reset', { token, password });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    window.location.href = '/login?reset=1';
  }

  return (
    <div className="container page-pad">
      <Seo title="Choose a new password" noindex />
      <div className="card auth-card">
        <h1>Choose a new password</h1>
        {!token ? (
          <p className="alert alert-error">
            This reset link is incomplete. <Link href="/forgot-password">Request a new one</Link>.
          </p>
        ) : (
          <>
            {error ? (
              <p className="alert alert-error" role="alert">
                {error}
              </p>
            ) : null}
            <form className="form" onSubmit={submit}>
              <label className="field">
                <span>
                  New password <span className="hint">(at least 8 characters)</span>
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <label className="field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <button type="submit" className="btn" disabled={busy}>
                {busy ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(async (ctx) => {
  ctx.res.setHeader('Referrer-Policy', 'no-referrer');
  return { props: { token: qp(ctx, 'token', 200) } };
});
