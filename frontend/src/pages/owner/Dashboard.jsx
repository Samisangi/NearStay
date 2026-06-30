import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';

const STATUS_COLORS = { active: 'success', rented: 'teal', inactive: 'neutral' };

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');

  useEffect(() => {
    Promise.all([
      api.get('/listings/owner/mine'),
      api.get('/inquiries/owner'),
    ])
      .then(([lRes, iRes]) => {
        setListings(lRes.data.listings || []);
        setInquiries(iRes.data.inquiries || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/listings/${id}`);
    setListings((prev) => prev.filter((l) => l._id !== id));
  };

  const handleStatusChange = async (id, status) => {
    await api.patch(`/listings/${id}`, { status });
    setListings((prev) => prev.map((l) => l._id === id ? { ...l, status } : l));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">Owner dashboard</h1>
        <Button icon={Plus} onClick={() => navigate('/owner/listings/new')}>New listing</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-paper-200 mb-6">
        {['listings', 'inquiries'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors
              ${tab === t ? 'border-teal-500 text-teal-600' : 'border-transparent text-ink-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full mb-3" />)}

      {/* Listings tab */}
      {!loading && tab === 'listings' && (
        <div className="space-y-3">
          {listings.length === 0 && (
            <p className="text-ink-500">No listings yet. <button className="text-teal-600 underline" onClick={() => navigate('/owner/listings/new')}>Create one</button></p>
          )}
          {listings.map((l) => (
            <div key={l._id} className="bg-paper-50 border border-paper-200 rounded-card p-4 flex items-center gap-4">
              <div className="h-14 w-20 bg-paper-200 rounded-control overflow-hidden shrink-0">
                {l.coverPhoto && <img src={l.coverPhoto} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{l.title}</p>
                <p className="text-sm text-ink-500">Rs {l.rent?.toLocaleString()}/mo · {l.inquiryCount || 0} inquiries</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={l.status}
                  onChange={(e) => handleStatusChange(l._id, e.target.value)}
                  className="h-8 text-xs rounded-control border border-paper-300 bg-paper-50 px-2"
                >
                  <option value="active">Active</option>
                  <option value="rented">Rented</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button onClick={() => navigate(`/owner/listings/${l._id}/edit`)} className="p-1.5 text-ink-500 hover:text-teal-600">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(l._id)} className="p-1.5 text-ink-500 hover:text-danger-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inquiries tab */}
      {!loading && tab === 'inquiries' && (
        <div className="space-y-3">
          {inquiries.length === 0 && <p className="text-ink-500">No inquiries received yet.</p>}
          {inquiries.map((inq) => (
            <div key={inq._id} className="bg-paper-50 border border-paper-200 rounded-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{inq.seekerId?.name || 'Seeker'}</p>
                  <p className="text-xs text-ink-500 mb-1">{inq.listingId?.title}</p>
                  <p className="text-sm text-ink-700">{inq.message}</p>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <Badge variant={inq.status === 'responded' ? 'teal' : 'neutral'} className="capitalize">
                    {inq.status}
                  </Badge>
                  {inq.status === 'pending' && (
                    <button
                      onClick={() => api.patch(`/inquiries/${inq._id}/status`, { status: 'responded' })
                        .then(() => setInquiries((prev) => prev.map((i) => i._id === inq._id ? { ...i, status: 'responded' } : i)))}
                      className="text-xs text-teal-600 underline"
                    >
                      Mark responded
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;