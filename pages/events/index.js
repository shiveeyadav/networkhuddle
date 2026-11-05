import Link from 'next/link';
import Seo from '../../components/Seo';
import EventCard from '../../components/EventCard';
import { useSite } from '../../components/SiteContext';
import { FORMATS, THEMES, REGIONS, FREE_VISITS, labelFor } from '../../lib/constants';
import { withSession, qp } from '../../lib/ssr';
import { query } from '../../lib/db';
import { EVENT_SELECT, isIsoDate } from '../../lib/events';
import { presentEvent } from '../../lib/format';

const MAX_RESULTS = 100;

function pickFrom(list, value) {
  return list.some((item) => item.value === value) ? value : '';
}

export default function Events({ events, filters, truncated }) {
  const { viewer } = useSite();
  const hasFilters = filters.format || filters.theme || filters.region || filters.from || filters.to;
  const regionLabel = labelFor(REGIONS, filters.region);
  const formatLabel = labelFor(FORMATS, filters.format);
  const title = regionLabel
    ? `Business networking meetings in ${regionLabel}`
    : formatLabel
      ? `${formatLabel} meetings`
      : 'Upcoming networking meetings';

  return (
    <div className="container page-pad">
      <Seo
        title={title}
        description="Upcoming NetworkHuddle meetings across the UK: online themed meetings, online speed networking and face-to-face breakfast and evening meetings. Visitors can attend up to three free."
        noindex={!!(filters.theme || filters.from || filters.to)}
      />
      <p className="eyebrow">Meetings</p>
      <h1>{title}</h1>
      <p className="lead">
        All times are UK time. {viewer && viewer.isMember ? 'Book as many as you like.' : `Visitors can book up to ${FREE_VISITS} meetings free before joining.`}
      </p>

      <form className="filters" method="get" action="/events">
        <label className="field">
          <span>Format</span>
          <select name="format" defaultValue={filters.format}>
            <option value="">All formats</option>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Theme</span>
          <select name="theme" defaultValue={filters.theme}>
            <option value="">All themes</option>
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Region</span>
          <select name="region" defaultValue={filters.region}>
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>From</span>
          <input type="date" name="from" defaultValue={filters.from} />
        </label>
        <label className="field">
          <span>To</span>
          <input type="date" name="to" defaultValue={filters.to} />
        </label>
        <div className="btn-row">
          <button type="submit" className="btn">
            Filter
          </button>
          {hasFilters ? <Link href="/events">Clear</Link> : null}
        </div>
      </form>

      {filters.region ? (
        <p className="muted small">Showing face-to-face meetings in {regionLabel}. Online meetings are open to everyone, wherever you are.</p>
      ) : null}

      {events.length ? (
        <div className="grid grid-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <p className="empty">
          No upcoming meetings match those filters. {hasFilters ? <Link href="/events">See all meetings</Link> : 'New meetings are added every week.'}
        </p>
      )}
      {truncated ? <p className="muted small">Showing the next {MAX_RESULTS} meetings. Narrow the filters to see more.</p> : null}
    </div>
  );
}

export const getServerSideProps = withSession(async (ctx) => {
  const filters = {
    format: pickFrom(FORMATS, qp(ctx, 'format')),
    theme: pickFrom(THEMES, qp(ctx, 'theme')),
    region: pickFrom(REGIONS, qp(ctx, 'region')),
    from: isIsoDate(qp(ctx, 'from', 10)) ? qp(ctx, 'from', 10) : '',
    to: isIsoDate(qp(ctx, 'to', 10)) ? qp(ctx, 'to', 10) : '',
  };

  const where = ["e.status = 'scheduled'", 'e.starts_at > now()'];
  const params = [];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  if (filters.format) where.push(`e.format = ${add(filters.format)}`);
  if (filters.theme) where.push(`e.theme = ${add(filters.theme)}`);
  if (filters.region) where.push(`e.region = ${add(filters.region)}`);
  // Date filters are whole UK days (inclusive).
  if (filters.from) where.push(`e.starts_at >= (${add(filters.from)}::date::timestamp AT TIME ZONE 'Europe/London')`);
  if (filters.to) where.push(`e.starts_at < ((${add(filters.to)}::date + 1)::timestamp AT TIME ZONE 'Europe/London')`);

  const { rows } = await query(
    `${EVENT_SELECT} WHERE ${where.join(' AND ')} ORDER BY e.starts_at ASC LIMIT ${MAX_RESULTS + 1}`,
    params
  );

  return {
    props: {
      events: rows.slice(0, MAX_RESULTS).map(presentEvent),
      truncated: rows.length > MAX_RESULTS,
      filters,
    },
  };
});
