import { useState } from 'react';
import Link from 'next/link';
import Seo from '../../components/Seo';
import Avatar from '../../components/Avatar';
import { REGIONS, INDUSTRIES } from '../../lib/constants';
import { postJSON } from '../../lib/client';
import { withSession } from '../../lib/ssr';

export default function EditProfile({ profile, welcome }) {
  const [form, setForm] = useState(profile);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState(profile.slug);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    const res = await postJSON('/api/profile', form);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setForm((f) => ({ ...f, ...res.data.profile }));
    setSlug(res.data.profile.slug);
    setSaved(true);
  }

  return (
    <div className="container narrow page-pad">
      <Seo title="Edit your profile" noindex />
      {welcome ? (
        <p className="alert alert-success">
          Welcome to NetworkHuddle! Tell people what you do and who you&rsquo;d like to meet, then{' '}
          <Link href="/events">book your first meeting</Link>.
        </p>
      ) : null}
      <div className="section-head">
        <h1>Your profile</h1>
        <Link href={`/m/${slug}`}>View public profile &rarr;</Link>
      </div>
      <div className="card">
        {error ? (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? <p className="alert alert-success">Profile saved.</p> : null}
        <form className="form" onSubmit={submit} noValidate>
          <div className="profile-head">
            <Avatar name={form.name} url={form.avatarUrl} size={72} />
            <label className="field field-wide">
              <span>
                Photo URL <span className="hint">(a link to a square image, e.g. from your website or LinkedIn)</span>
              </span>
              <input type="url" value={form.avatarUrl} onChange={set('avatarUrl')} maxLength={500} placeholder="https://" />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Name</span>
              <input type="text" value={form.name} onChange={set('name')} maxLength={80} required />
            </label>
            <label className="field">
              <span>Business name</span>
              <input type="text" value={form.businessName} onChange={set('businessName')} maxLength={120} />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Your role</span>
              <input type="text" value={form.jobRole} onChange={set('jobRole')} maxLength={100} placeholder="e.g. Founder, Director" />
            </label>
            <label className="field">
              <span>Region</span>
              <select value={form.region} onChange={set('region')}>
                <option value="">Choose a region</option>
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Industry</span>
              <select value={form.industry} onChange={set('industry')}>
                <option value="">Choose an industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Website</span>
              <input type="url" value={form.website} onChange={set('website')} maxLength={500} placeholder="https://" />
            </label>
            <label className="field">
              <span>LinkedIn profile</span>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={set('linkedinUrl')}
                maxLength={500}
                placeholder="https://www.linkedin.com/in/..."
              />
            </label>
          </div>
          <label className="field">
            <span>
              Short bio <span className="hint">(up to 1,000 characters)</span>
            </span>
            <textarea rows={5} value={form.bio} onChange={set('bio')} maxLength={1000} />
          </label>
          <label className="field">
            <span>What I offer</span>
            <textarea
              rows={3}
              value={form.offer}
              onChange={set('offer')}
              maxLength={600}
              placeholder="The products or services you provide, and who they're for."
            />
          </label>
          <label className="field">
            <span>Who I&rsquo;m looking to meet</span>
            <textarea
              rows={3}
              value={form.lookingFor}
              onChange={set('lookingFor')}
              maxLength={600}
              placeholder="Your ideal clients, partners or introductions."
            />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={!!form.isPublic} onChange={set('isPublic')} />
            <span>
              Show my profile in the member directory and on meeting attendee lists. Untick to keep your profile
              hidden (you can still book meetings).
            </span>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(
  async (ctx, user) => ({
    props: {
      welcome: ctx.query.welcome === '1',
      profile: {
        slug: user.slug,
        name: user.name,
        businessName: user.business_name,
        jobRole: user.job_role,
        region: user.region,
        industry: user.industry,
        website: user.website,
        bio: user.bio,
        offer: user.offer,
        lookingFor: user.looking_for,
        avatarUrl: user.avatar_url,
        linkedinUrl: user.linkedin_url,
        isPublic: user.is_public,
      },
    },
  }),
  { auth: true }
);
