import Link from 'next/link';

export function FormatBadge({ format, label }) {
  return <span className={`badge badge-${format}`}>{label}</span>;
}

export default function EventCard({ event }) {
  const where = event.format === 'face2face' ? `${event.venueName}${event.regionLabel ? ` · ${event.regionLabel}` : ''}` : 'Online';
  return (
    <article className={`event-card${event.status === 'cancelled' ? ' is-cancelled' : ''}`}>
      <div className="date-tile" aria-hidden="true">
        <span className="date-tile-wd">{event.weekdayShort}</span>
        <span className="date-tile-day">{event.dayNum}</span>
        <span className="date-tile-month">{event.monthShort}</span>
      </div>
      <div className="event-card-body">
        <div className="event-card-tags">
          <FormatBadge format={event.format} label={event.formatLabel} />
          {event.theme !== 'general' ? <span className="tag">{event.themeLabel}</span> : null}
          {event.status === 'cancelled' ? <span className="tag tag-danger">Cancelled</span> : null}
        </div>
        <h3 className="event-card-title">
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </h3>
        <p className="event-card-meta">
          {event.dateLabel} &middot; {event.timeLabel} UK time
        </p>
        <p className="event-card-meta">{where}</p>
        <p className="event-card-seats">
          {event.status === 'cancelled'
            ? 'This meeting has been cancelled'
            : event.seatsLeft > 0
              ? `${event.seatsLeft} of ${event.capacity} seats left`
              : 'Fully booked'}
        </p>
      </div>
    </article>
  );
}
