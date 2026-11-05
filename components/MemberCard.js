import Link from 'next/link';
import Avatar from './Avatar';
import { truncate } from '../lib/format';

export default function MemberCard({ member }) {
  return (
    <article className="member-card">
      <Avatar name={member.name} url={member.avatarUrl} size={56} />
      <div className="member-card-body">
        <h3 className="member-card-name">
          <Link href={`/m/${member.slug}`}>{member.name}</Link>
          {member.isMember ? <span className="member-pill">Member</span> : null}
        </h3>
        <p className="member-card-business">
          {[member.jobRole, member.businessName].filter(Boolean).join(', ') || ' '}
        </p>
        <p className="member-card-meta">
          {[member.industryLabel, member.regionLabel].filter(Boolean).join(' · ')}
        </p>
        {member.offer ? <p className="member-card-offer">{truncate(member.offer, 120)}</p> : null}
      </div>
    </article>
  );
}
