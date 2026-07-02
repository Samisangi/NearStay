import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import api from '../api/axiosInstance';
import Skeleton from '../components/ui/Skeleton';
import Badge from '../components/ui/Badge';
import ChatWindow from '../components/chat/ChatWindow';

const STATUS_CONFIG = {
  pending:   { color: 'neutral',  icon: Clock,         label: 'Pending' },
  responded: { color: 'teal',     icon: CheckCircle,   label: 'Responded' },
  closed:    { color: 'neutral',  icon: XCircle,       label: 'Closed' },
};

const MyInquiries = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/inquiries/seeker${params}`)
      .then((res) => setInquiries(res.data.inquiries || []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this inquiry and all messages?')) return;
    await api.delete(`/inquiries/${id}`);
    setInquiries((prev) => prev.filter((i) => i._id !== id));
    if (selected?._id === id) setSelected(null);
  };

  const filtered = inquiries;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-2">My inquiries</h1>
      <p className="text-ink-500 text-sm mb-6">Rooms you've contacted owners about.</p>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-paper-200 mb-6">
        {['all', 'pending', 'responded', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setLoading(true); }}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors
              ${filter === s ? 'border-teal-500 text-teal-600' : 'border-transparent text-ink-500'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare size={36} className="text-paper-300 mx-auto mb-3" />
          <p className="text-ink-500">No inquiries yet.</p>
          <button
            onClick={() => navigate('/search')}
            className="text-teal-600 text-sm underline mt-1"
          >
            Browse rooms
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inquiry list */}
          <div className="space-y-3">
            {filtered.map((inq) => {
              const cfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const isSelected = selected?._id === inq._id;

              return (
                <div
                  key={inq._id}
                  onClick={() => setSelected(inq)}
                  className={`bg-paper-50 border rounded-card p-4 cursor-pointer transition-all
                    ${isSelected ? 'border-teal-500 shadow-card' : 'border-paper-200 hover:border-teal-300'}`}
                >
                  <div className="flex gap-3">
                    {/* Listing cover */}
                    <div className="h-14 w-16 rounded-control bg-paper-200 overflow-hidden shrink-0">
                      {inq.listingId?.coverPhoto
                        ? <img src={inq.listingId.coverPhoto} alt="" className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center text-ink-300 text-xs">No img</div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-ink-900 truncate">
                          {inq.listingId?.title || 'Listing removed'}
                        </p>
                        <Badge variant={cfg.color} className="shrink-0 text-xs flex items-center gap-1">
                          <StatusIcon size={11} />
                          {cfg.label}
                        </Badge>
                      </div>

                      {inq.listingId?.rent && (
                        <p className="text-xs text-ink-500 mt-0.5">
                          Rs {inq.listingId.rent.toLocaleString()}/mo · {inq.listingId.address}
                        </p>
                      )}

                      {inq.latestMessage && (
                        <p className="text-xs text-ink-400 mt-1 truncate">
                          {inq.latestMessage.text}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-ink-300">
                          Owner: {inq.ownerId?.name} · {new Date(inq.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDelete(inq._id, e)}
                            className="text-xs text-ink-400 hover:text-danger-500 transition-colors"
                          >
                            Delete
                          </button>
                          <ChevronRight size={14} className="text-ink-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat panel */}
          <div className="hidden md:block">
            {selected ? (
              <div className="sticky top-24 space-y-3">
                <div className="bg-paper-50 border border-paper-200 rounded-card p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{selected.listingId?.title}</p>
                    <button
                      onClick={() => navigate(`/listings/${selected.listingId?._id}`)}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      View listing
                    </button>
                  </div>
                  <p className="text-xs text-ink-500">Chatting with {selected.ownerId?.name}</p>
                  {selected.ownerId?.phone && (
                    <a
                      href={`tel:${selected.ownerId.phone}`}
                      className="text-xs text-teal-600 hover:underline mt-0.5 block"
                    >
                      {selected.ownerId.phone}
                    </a>
                  )}
                </div>
                <ChatWindow inquiryId={selected._id} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-paper-300 rounded-card">
                <p className="text-ink-400 text-sm">Select an inquiry to open chat</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile chat modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 flex items-end md:hidden"
          onClick={() => setSelected(null)}>
          <div className="w-full bg-paper-50 rounded-t-card p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm truncate">{selected.listingId?.title}</p>
              <button onClick={() => setSelected(null)} className="text-ink-500 text-sm">Close</button>
            </div>
            <ChatWindow inquiryId={selected._id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInquiries;