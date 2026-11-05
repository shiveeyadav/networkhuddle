import Link from 'next/link';

const ITEMS = [
  { href: '/admin', label: 'Meetings' },
  { href: '/admin/events/new', label: 'New meeting' },
  { href: '/admin/members', label: 'Members' },
];

export default function AdminNav({ current }) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`btn btn-small${current === item.href ? '' : ' btn-secondary'}`}
          aria-current={current === item.href ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
