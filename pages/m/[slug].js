import { useState } from 'react';
import Link from 'next/link';
import Seo from '../../components/Seo';
import Avatar from '../../components/Avatar';
import { useSite } from '../../components/SiteContext';
import { postJSON } from '../../lib/client';
import { truncate, presentMember } from '../../lib/format';
import { withSession } from '../../lib/ssr';
import { query } from '../../lib/db';

function RequestOneToOne({ member }) {
  const [proposedAt, setProposedAt] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await postJSON('/api/one-to-ones', { recipientSlug: member.slug, proposedAt, message });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="alert alert-success">
        Request sent. You&rsquo;ll see {member.name.split(' ')[0]}&rsquo;s reply in <Link href="/one-to-ones">My 1-1s</Link>.
      </p>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : null}
      <label className="field">
        <span>Proposed date and time (UK time)</span>
        <input type="datetime-local" value={proposedAt} onChange={(e) => setProposedAt(e.target.value)} required />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          required
          placeholder="Say why you'd like to meet and suggest online or in person."
        />
      </label>
      <button type="submit" className="btn" disabled={busy}>
        {busy ? 'Sending…' : 'Request a 1-1'}
      </button>
    </form>
  );
}

export default function MemberProfile({ member, isOwn, isHidden }) {
  const { viewer } = useSite();
  const first = member.name.split(' ')[0];
  const subtitle = [member.jobRole, member.businessName].filter(Boolean).join(', ');
  const description = member.bio
    ? truncate(member.bio, 155)
    : `${member.name}${subtitle ? `, ${subtitle}` : ''} on NetworkHuddle, the UK business networking membership.`;

  return (
    <div className="container page-pad">
      <Seo title={`${member.name}${member.businessName ? ` - ${member.businessName}` : ''}`} description={description} noindex={!member.bio || isHidden} />
      {isHidden ? (
        <p className="alert alert-info">
          Your profile is hidden from the directory. Only you and admins can see this page.{' '}
          <Link href="/profile/edit">Change this</Link>
        </p>
      ) : null}
      <div className="profile-head">
        <Avatar name={member.name} url={member.avatarUrl} size={112} />
        <div>
          <h1>{member.name}</h1>
          {subtitle ? <p className="lead" style={{ margin: 0 }}>{subtitle}</p> : null}
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {[member.industryLabel, member.regionLabel].filter(Boolean).join(' · ')}
            {member.isMember ? <span className="member-pill" style={{ marginLeft: 8 }}>Member</span> : null}
          </p>
        </div>
      </div>

      <div className="profile-layout">
        <div>
          <section className="card">
            <h2>About</h2>
            <p className="prose">{member.bio || `${first} hasn’t written a bio yet.`}</p>
          </section>
          {member.offer ? (
            <section className="card">
              <h2>What I offer</h2>
              <p className="prose">{member.offer}</p>
            </section>
          ) : null}
          {member.lookingFor ? (
            <section className="card">
              <h2>Who I&rsquo;m looking to meet</h2>
              <p className="prose">{member.lookingFor}</p>
            </section>
          ) : null}
        </div>

        <aside>
          {member.website || member.linkedinUrl ? (
            <section className="card">
              <h2>Links</h2>
              <dl className="kv">
                {member.website ? (
                  <>
                    <dt>Website</dt>
                    <dd>
                      <a href={member.website} target="_blank" rel="noopener noreferrer nofollow ugc">
                        {member.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </dd>
                  </>
                ) : null}
                {member.linkedinUrl ? (
                  <>
                    <dt>LinkedIn</dt>
                    <dd>
                      <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow ugc">
                        View profile
                      </a>
                    </dd>
                  </>
                ) : null}
              </dl>
            </section>
          ) : null}

          <section className="card">
            <h2>Meet {first} 1-1</h2>
            {isOwn ? (
              <p>
                This is your public profile. <Link href="/profile/edit">Edit profile</Link>
              </p>
            ) : !viewer ? (
              <p>
                <Link href={`/login?next=${encodeURIComponent(`/m/${member.slug}`)}`}>Log in</Link> or{' '}
                <Link href={`/signup?next=${encodeURIComponent(`/m/${member.slug}`)}`}>create a free account</Link> to
                request a 1-1.
              </p>
            ) : !viewer.isMember ? (
              <p>
                Booking 1-1s is a member benefit. <Link href="/membership">See membership options</Link>.
              </p>
            ) : (
              <RequestOneToOne member={member} />
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(async (ctx, user) => {
  const slug = String(ctx.params.slug || '').slice(0, 100);
  const { rows } = await query(
    `SELECT id, slug, name, business_name, job_role, region, industry, website, bio, offer, looking_for,
            avatar_url, linkedin_url, is_member, role, is_public
       FROM users
      WHERE slug = $1 AND is_suspended = FALSE`,
    [slug]
  );
  const row = rows[0];
  if (!row) return { notFound: true };
  const isOwn = !!user && user.id === row.id;
  const isAdmin = !!user && user.role === 'admin';
  if (!row.is_public && !isOwn && !isAdmin) return { notFound: true };
  return { props: { member: presentMember(row), isOwn, isHidden: !row.is_public } };
});
