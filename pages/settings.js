import { useState } from 'react';
import Link from 'next/link';
import Seo from '../components/Seo';
import { postJSON } from '../lib/client';
import { withSession, contactEmail } from '../lib/ssr';
import { isMemberUser } from '../lib/auth';
import { ukDate } from '../lib/format';

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setDone(false);
    if (next !== confirm) {
      setError('The two new passwords don’t match.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await postJSON('/api/account/password', { currentPassword: current, newPassword: next });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(true);
  }

  return (
    <form className="form" onSubmit={submit}>
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : null}
      {done ? <p className="alert alert-success">Password changed. Other devices have been signed out.</p> : null}
      <label className="field">
        <span>Current password</span>
        <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </label>
      <div className="field-row">
        <label className="field">
          <span>
            New password <span className="hint">(at least 8 characters)</span>
          </span>
          <input type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-secondary" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}

function DeleteAccount() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!window.confirm('Delete your NetworkHuddle account permanently? This cannot be undone.')) return;
    setBusy(true);
    setError('');
    const res = await postJSON('/api/account/delete', { password, confirm });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    window.location.href = '/?deleted=1';
  }

  return (
    <form className="form" onSubmit={submit}>
      <p>
        This permanently deletes your profile, meeting bookings and 1-1 requests, and signs you out. It can&rsquo;t be
        undone. If you&rsquo;re a paying member, contact us as well so we can stop your membership.
      </p>
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : null}
      <label className="field">
        <span>Your password</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        <span>I understand my account and data will be deleted permanently.</span>
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-danger" disabled={busy || !confirm || !password}>
          {busy ? 'Deleting…' : 'Delete my account'}
        </button>
      </div>
    </form>
  );
}

export default function Settings({ account, contact }) {
  return (
    <div className="container narrow page-pad">
      <Seo title="Settings" noindex />
      <h1>Settings</h1>

      <section className="card">
        <h2>Your account</h2>
        <dl className="kv">
          <dt>Email</dt>
          <dd>{account.email}</dd>
          <dt>Account type</dt>
          <dd>
            {account.isMember ? `Member${account.memberSince ? ` since ${account.memberSince}` : ''}` : 'Visitor'}
            {!account.isMember ? (
              <>
                {' '}
                &middot; <Link href="/membership">Become a member</Link>
              </>
            ) : null}
          </dd>
          <dt>Joined</dt>
          <dd>{account.joined}</dd>
        </dl>
        <p className="small muted">
          To change your email address, contact <a href={`mailto:${contact}`}>{contact}</a>. To change your name, photo or
          visibility, <Link href="/profile/edit">edit your profile</Link>.
        </p>
      </section>

      <section className="card">
        <h2>Change password</h2>
        <ChangePassword />
      </section>

      <section className="card">
        <h2>Delete my account</h2>
        <DeleteAccount />
      </section>
    </div>
  );
}

export const getServerSideProps = withSession(
  async (ctx, user) => ({
    props: {
      contact: contactEmail(),
      account: {
        email: user.email,
        isMember: isMemberUser(user),
        memberSince: user.member_since ? ukDate(user.member_since) : '',
        joined: ukDate(user.created_at),
      },
    },
  }),
  { auth: true }
);
