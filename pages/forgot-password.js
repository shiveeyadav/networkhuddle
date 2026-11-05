import { useState } from 'react';
import Link from 'next/link';
import Seo from '../components/Seo';
import { postJSON } from '../lib/client';
import { withSession } from '../lib/ssr';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await postJSON('/api/auth/forgot', { email });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSent(true);
  }

  return (
    <div className="container page-pad">
      <Seo title="Reset your password" noindex />
      <div className="card auth-card">
        <h1>Reset your password</h1>
        {sent ? (
          <p className="alert alert-success">
            If an account exists for that email, we&rsquo;ve sent a link to reset the password. It expires in one
            hour. Check your spam folder if it doesn&rsquo;t arrive.
          </p>
        ) : (
          <>
            <p className="muted">Enter the email you signed up with and we&rsquo;ll send you a reset link.</p>
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
              <button type="submit" className="btn" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <p className="small" style={{ marginTop: 16 }}>
          <Link href="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession();
