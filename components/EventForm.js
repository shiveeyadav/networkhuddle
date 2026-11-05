import { useState } from 'react';
import { FORMATS, THEMES, REGIONS } from '../lib/constants';
import { postJSON } from '../lib/client';

const EMPTY = {
  title: '',
  format: 'online',
  theme: 'general',
  region: '',
  startsAtLocal: '',
  durationMinutes: 60,
  capacity: 20,
  venueName: '',
  venueAddress: '',
  onlineLink: '',
  description: '',
};

// Admin form for creating or editing an event.
// `initial` uses the same keys as EMPTY; `action` is the API URL.
export default function EventForm({ initial, action, submitLabel, onSaved, extraBody }) {
  const [form, setForm] = useState({ ...EMPTY, ...(initial || {}) });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await postJSON(action, { ...(extraBody || {}), ...form });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (onSaved) onSaved(res.data);
  }

  const isF2F = form.format === 'face2face';

  return (
    <form className="form" onSubmit={submit} noValidate>
      {error ? (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      ) : null}
      <label className="field">
        <span>Title</span>
        <input type="text" value={form.title} onChange={set('title')} maxLength={120} required />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Format</span>
          <select value={form.format} onChange={set('format')}>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Theme</span>
          <select value={form.theme} onChange={set('theme')}>
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Region {isF2F ? '(required)' : '(optional)'}</span>
          <select value={form.region} onChange={set('region')}>
            <option value="">None / UK-wide</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>Starts (UK time)</span>
          <input type="datetime-local" value={form.startsAtLocal} onChange={set('startsAtLocal')} required />
        </label>
        <label className="field">
          <span>Duration (minutes)</span>
          <input type="number" min="10" max="600" value={form.durationMinutes} onChange={set('durationMinutes')} />
        </label>
        <label className="field">
          <span>Capacity</span>
          <input type="number" min="1" max="1000" value={form.capacity} onChange={set('capacity')} />
        </label>
      </div>
      {isF2F ? (
        <div className="field-row">
          <label className="field">
            <span>Venue name</span>
            <input type="text" value={form.venueName} onChange={set('venueName')} maxLength={150} />
          </label>
          <label className="field field-wide">
            <span>Venue address</span>
            <input type="text" value={form.venueAddress} onChange={set('venueAddress')} maxLength={300} />
          </label>
        </div>
      ) : (
        <label className="field">
          <span>Meeting link (only shown to booked attendees)</span>
          <input type="url" value={form.onlineLink} onChange={set('onlineLink')} maxLength={500} placeholder="https://" />
        </label>
      )}
      <label className="field">
        <span>Description</span>
        <textarea rows={8} value={form.description} onChange={set('description')} maxLength={5000} />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving…' : submitLabel || 'Save'}
        </button>
      </div>
    </form>
  );
}
