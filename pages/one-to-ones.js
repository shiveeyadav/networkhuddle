import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Seo from '../components/Seo';
import Avatar from '../components/Avatar';
import { postJSON } from '../lib/client';
import { withSession } from '../lib/ssr';
import { query } from '../lib/db';
import { ukDateTime } from '../lib/format';

const STATUS_LABEL = { pending: 'Awaiting reply', accepted: 'Accepted', declined: 'Declined', cancelled: 'Cancelled' };

function OneToOneItem({ item, direction }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function act(action) {
    if (action === 'cancel' && !window.confirm('Cancel this 1-1?')) return;
    setBusy(true);
    setError('');
    const res = await postJSON(`/api/one-to-ones/${item.id}`, { action, note });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace(router.asPath, undefined, { scroll: false });
  }

  const canRespond = direction === 'incoming' && item.status === 'pending';
  const canCancel = (item.status === 'pending' && direction === 'outgoing') || (item.status === 'accepted' && !item.isPast);

  return (
    <li className="oto">
      <Avatar name={item.otherName} url={item.otherAvatarUrl} size={48} />
      <div className="oto-body">
        <p>
          <strong>
            {item.otherSlug ? <Link href={`/m/${item.otherSlug}`}>{item.otherName}</Link> : item.otherName}
          </strong>
          {item.otherBusiness ? <span className="muted"> &middot; {item.otherBusiness}</span> : null}{' '}
          <span className={`tag status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
        </p>
        <p className="small">
          <strong>{item.whenLabel}</strong> UK time
          {item.isPast && item.status !== 'cancelled' && item.status !== 'declined' ? <span className="muted"> (past)</span> : null}
        </p>
        {item.message ? <p className="prose small">&ldquo;{item.message}&rdquo;</p> : null}
        {item.responseNote ? (
          <p className="prose small muted">
            Note: {item.responseNote}
          </p>
        ) : null}
        {error ? <p className="alert alert-error small">{error}</p> : null}
        {canRespond ? (
          <div className="form" style={{ marginTop: 8 }}>
            <label className="field">
              <span className="small">Optional note (e.g. a video link or a different time)</span>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </label>
            <div className="btn-row">
              <button type="button" className="btn btn-small" disabled={busy} onClick={() => act('accept')}>
                Accept
              </button>
              <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={() => act('decline')}>
                Decline
              </button>
            </div>
          </div>
        ) : null}
        {canCancel ? (
          <button type="button" className="btn btn-danger btn-small" disabled={busy} onClick={() => act('cancel')} style={{ marginTop: 8 }}>
            Cancel 1-1
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default function OneToOnes({ incoming, outgoing, isMember }) {
  return (
    <div className="container narrow page-pad">
      <Seo title="My 1-1s" noindex />
      <h1>My 1-1s</h1>
      <p className="lead">
        1-1s are where networking turns into business. Request one from any member&rsquo;s profile.
      </p>
      {!isMember ? (
        <p className="alert alert-info">
          You can accept 1-1s as a visitor. Requesting them is a member benefit: <Link href="/membership">see membership</Link>.
        </p>
      ) : null}

      <section className="section" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <h2>Requests to you</h2>
        {incoming.length ? (
          <ul className="oto-list">
            {incoming.map((item) => (
              <OneToOneItem key={item.id} item={item} direction="incoming" />
            ))}
          </ul>
        ) : (
          <p className="empty">No one has asked you for a 1-1 yet. A complete profile helps.</p>
        )}
      </section>

      <section className="section" style={{ paddingTop: 16 }}>
        <h2>Requests you&rsquo;ve sent</h2>
        {outgoing.length ? (
          <ul className="oto-list">
            {outgoing.map((item) => (
              <OneToOneItem key={item.id} item={item} direction="outgoing" />
            ))}
          </ul>
        ) : (
          <p className="empty">
            You haven&rsquo;t requested any 1-1s yet. <Link href="/members">Browse the directory</Link>.
          </p>
        )}
      </section>
    </div>
  );
}

function present(row) {
  return {
    id: row.id,
    status: row.status,
    message: row.message,
    responseNote: row.response_note,
    whenLabel: ukDateTime(row.proposed_at),
    isPast: new Date(row.proposed_at).getTime() < Date.now(),
    otherName: row.other_name,
    otherSlug: row.other_suspended ? '' : row.other_slug,
    otherBusiness: row.other_business,
    otherAvatarUrl: row.other_avatar,
  };
}

export const getServerSideProps = withSession(
  async (ctx, user) => {
    const sql = (otherCol, selfCol) => `
      SELECT o.*, u.name AS other_name, u.slug AS other_slug, u.business_name AS other_business,
             u.avatar_url AS other_avatar, u.is_suspended AS other_suspended
        FROM one_to_ones o
        JOIN users u ON u.id = o.${otherCol}
       WHERE o.${selfCol} = $1
       ORDER BY (o.status = 'pending') DESC, o.proposed_at DESC
       LIMIT 200`;
    const [inc, out] = await Promise.all([
      query(sql('requester_id', 'recipient_id'), [user.id]),
      query(sql('recipient_id', 'requester_id'), [user.id]),
    ]);
    return {
      props: {
        incoming: inc.rows.map(present),
        outgoing: out.rows.map(present),
        isMember: user.is_member || user.role === 'admin',
      },
    };
  },
  { auth: true }
);
