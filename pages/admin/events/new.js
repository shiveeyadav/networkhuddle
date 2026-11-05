import { useRouter } from 'next/router';
import Seo from '../../../components/Seo';
import AdminNav from '../../../components/AdminNav';
import EventForm from '../../../components/EventForm';
import { withSession } from '../../../lib/ssr';

export default function NewEvent() {
  const router = useRouter();
  return (
    <div className="container narrow page-pad">
      <Seo title="New meeting" noindex />
      <p className="eyebrow">Admin</p>
      <h1>New meeting</h1>
      <AdminNav current="/admin/events/new" />
      <div className="card">
        <EventForm
          action="/api/admin/events"
          submitLabel="Create meeting"
          onSaved={(data) => router.push(`/admin/events/${data.id}?created=1`)}
        />
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(null, { admin: true });
