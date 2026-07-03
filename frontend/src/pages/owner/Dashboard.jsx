import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, MessageSquare, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import api from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ChatWindow from '../../components/chat/ChatWindow';

const STATUS_COLORS = { active: 'success', rented: 'teal', inactive: 'neutral' };

const INQUIRY_STATUS_CONFIG = {
  pending:   { color: 'neutral', icon: Clock,        label: 'Pending' },
  responded: { color: 'teal',   icon: CheckCircle,  label: 'Responded' },
  closed:    { color: 'neutral', icon: XCircle,      label: 'Closed' },
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [listings, setListings]   = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('listings');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

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

  const handleInquiryStatusChange = async (inquiryId, status) => {
    await api.patch(`/inquiries/${inquiryId}/status`, { status });
    setInquiries((prev) =>
      prev.map((i) => i._id === inquiryId ? { ...i, status } : i)
    );
    if (selectedInquiry?._id === inquiryId) {
      setSelectedInquiry((prev) => ({ ...prev, status }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">Owner dashboard</h1>
        <Button icon={Plus} onClick={() => navigate('/owner/listings/new')}>New listing</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-paper-200 mb-6">
        {['listings', 'inquiries'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedInquiry(null); }}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors
              ${tab === t ? 'border-teal-500 text-teal-600' : 'border-transparent text-ink-500'}`}
          >
            {t}
            {t === 'inquiries' && inquiries.filter(i => i.unreadCount > 0).length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-teal-500 text-white text-[10px] font-bold">
                {inquiries.filter(i => i.unreadCount > 0).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full mb-3" />)}

      {/* ── Listings tab ─────────────────────────────────────────────────── */}
      {!loading && tab === 'listings' && (
        <div className="space-y-3">
          {listings.length === 0 && (
            <p className="text-ink-500">
              No listings yet.{' '}
              <button className="text-teal-600 underline" onClick={() => navigate('/owner/listings/new')}>
                Create one
              </button>
            </p>
          )}
          {listings.map((l) => (
            <div key={l._id} className="bg-paper-50 border border-paper-200 rounded-card p-4 flex items-center gap-4">
              <div className="h-14 w-20 bg-paper-200 rounded-control overflow-hidden shrink-0">
                {l.coverPhoto && <img src={l.coverPhoto} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{l.title}</p>
                <p className="text-sm text-ink-500">
                  Rs {l.rent?.toLocaleString()}/mo · {l.inquiryCount || 0} inquiries
                </p>
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
                <button
                  onClick={() => navigate(`/owner/listings/${l._id}/edit`)}
                  className="p-1.5 text-ink-500 hover:text-teal-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(l._id)}
                  className="p-1.5 text-ink-500 hover:text-danger-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Inquiries tab ─────────────────────────────────────────────────── */}
      {!loading && tab === 'inquiries' && (
        <>
          {inquiries.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare size={36} className="text-paper-300 mx-auto mb-3" />
              <p className="text-ink-500">No inquiries received yet.</p>
            </div>
          )}

          {inquiries.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Inquiry list */}
              <div className="space-y-3">
                {inquiries.map((inq) => {
                  const cfg = INQUIRY_STATUS_CONFIG[inq.status] || INQUIRY_STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const isSelected = selectedInquiry?._id === inq._id;

                  return (
                    <div
                      key={inq._id}
                      onClick={() => setSelectedInquiry(inq)}
                      className={`bg-paper-50 border rounded-card p-4 cursor-pointer transition-all
                        ${isSelected
                          ? 'border-teal-500 shadow-card'
                          : 'border-paper-200 hover:border-teal-300'}`}
                    >
                      <div className="flex gap-3">
                        {/* Seeker avatar */}
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
                          {inq.seekerId?.name?.[0]?.toUpperCase() || 'S'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink-900 truncate">
                                {inq.seekerId?.name || 'Seeker'}
                              </p>
                              <p className="text-xs text-ink-400 truncate">
                                {inq.listingId?.title}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant={cfg.color} className="text-xs flex items-center gap-1">
                                <StatusIcon size={10} />
                                {cfg.label}
                              </Badge>
                              {inq.unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-teal-500 text-white text-[10px] font-bold">
                                  {inq.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {inq.latestMessage && (
                            <p className="text-xs text-ink-400 mt-1 truncate">
                              {inq.latestMessage.text}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-ink-300">
                              {new Date(inq.createdAt).toLocaleDateString()}
                            </p>
                            <ChevronRight size={14} className="text-ink-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat + actions panel */}
              <div className="hidden md:block">
                {selectedInquiry ? (
                  <div className="sticky top-24 space-y-3">
                    {/* Inquiry info header */}
                    <div className="bg-paper-50 border border-paper-200 rounded-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm text-ink-900">
                            {selectedInquiry.seekerId?.name || 'Seeker'}
                          </p>
                          <p className="text-xs text-ink-500 mt-0.5">
                            {selectedInquiry.listingId?.title}
                          </p>
                          {selectedInquiry.seekerId?.phone && (
                            <a
                              href={`tel:${selectedInquiry.seekerId.phone}`}
                              className="text-xs text-teal-600 hover:underline mt-0.5 block"
                            >
                              {selectedInquiry.seekerId.phone}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/listings/${selectedInquiry.listingId?._id}`)}
                          className="text-xs text-teal-600 hover:underline shrink-0"
                        >
                          View listing
                        </button>
                      </div>

                      {/* Status actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-paper-100">
                        <span className="text-xs text-ink-400">Mark as:</span>
                        {['pending', 'responded', 'closed'].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleInquiryStatusChange(selectedInquiry._id, s)}
                            className={`text-xs px-2 py-1 rounded-control border transition-colors capitalize
                              ${selectedInquiry.status === s
                                ? 'bg-teal-500 text-white border-teal-500'
                                : 'bg-paper-50 text-ink-500 border-paper-300 hover:border-teal-400'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Full chat window — owner can now type and reply */}
                    <ChatWindow inquiryId={selectedInquiry._id} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-dashed border-paper-300 rounded-card">
                    <div className="text-center">
                      <MessageSquare size={28} className="text-paper-300 mx-auto mb-2" />
                      <p className="text-ink-400 text-sm">Select an inquiry to reply</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile chat modal for owner */}
      {tab === 'inquiries' && selectedInquiry && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/40 flex items-end md:hidden"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="w-full bg-paper-50 rounded-t-card p-4 space-y-3 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm truncate">
                  {selectedInquiry.seekerId?.name || 'Seeker'}
                </p>
                <p className="text-xs text-ink-400 truncate">{selectedInquiry.listingId?.title}</p>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="text-ink-500 text-sm">
                Close
              </button>
            </div>

            {/* Status buttons on mobile */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-400">Mark:</span>
              {['pending', 'responded', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleInquiryStatusChange(selectedInquiry._id, s)}
                  className={`text-xs px-2 py-1 rounded-control border capitalize transition-colors
                    ${selectedInquiry.status === s
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'bg-paper-50 text-ink-500 border-paper-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <ChatWindow inquiryId={selectedInquiry._id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;