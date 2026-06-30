import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';

const STATUS_COLORS = { pending: 'neutral', responded: 'teal', closed: 'neutral' };

const MyInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inquiries/seeker')
      .then((res) => setInquiries(res.data.inquiries || []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-6">My inquiries</h1>

      {loading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full mb-3" />)}

      {!loading && inquiries.length === 0 && (
        <p className="text-ink-500">No inquiries sent yet. Contact a room owner from any listing.</p>
      )}

      {!loading && (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq._id} className="bg-paper-50 border border-paper-200 rounded-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">{inq.listingId?.title || 'Listing removed'}</p>
                  <p className="text-sm text-ink-500 mt-1">{inq.message}</p>
                </div>
                <Badge variant={STATUS_COLORS[inq.status]} className="capitalize shrink-0">
                  {inq.status}
                </Badge>
              </div>
              <p className="text-xs text-ink-300 mt-2">{new Date(inq.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInquiries;