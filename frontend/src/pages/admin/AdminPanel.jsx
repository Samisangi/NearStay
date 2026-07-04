import { useEffect, useState } from 'react';
import { Ban, Mapin, CheckCircle, Trash2, MessageSquare, LifeBuoy, Megaphone } from 'lucide-react';
import api from '../../api/axiosInstance';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const PRIORITY_COLOR = { low: 'neutral', medium: 'teal', high: 'coral' };
const STATUS_COLOR = { open: 'coral', in_review: 'teal', resolved: 'success', closed: 'neutral' };

const AdminPanel = () => {
  const [tab, setTab] = useState('tickets');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  const [sending, setSending] = useState(false);
const [areas, setAreas] = useState([]);
const [areaForm, setAreaForm] = useState({ label: '', city: '', lat: '', lng: '', order: 0 });
const [areaError, setAreaError] = useState('');
const [savingArea, setSavingArea] = useState(false);
  // Announce state
  const [announceTarget, setAnnounceTarget] = useState('all');
  const [announceSubject, setAnnounceSubject] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [announceSending, setAnnounceSending] = useState(false);
  const [announceResult, setAnnounceResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    const calls = {
      tickets: api.get('/support/all'),
      listings: api.get('/admin/listings'),
      users: api.get('/admin/users'),
      // add this line inside Promise.all calls object:
areas: api.get('/featured-areas/all'),
    };

    Promise.all(Object.values(calls))
      .then(([tRes, lRes, uRes, aRes]) => {
        setTickets(tRes.data.tickets || []);
        setListings(lRes.data.listings || []);
        setUsers(uRes.data.users || []);
          setAreas(aRes.data.areas || []);

      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await api.patch(`/support/${selectedTicket._id}/reply`, {
        adminReply: reply,
        status: replyStatus,
      });
      setTickets((prev) =>
        prev.map((t) => t._id === selectedTicket._id ? res.data.ticket : t)
      );
      setSelectedTicket(res.data.ticket);
      setReply('');
    } catch {} finally {
      setSending(false);
    }
  };

  const handleTicketStatus = async (id, status) => {
    const res = await api.patch(`/support/${id}/status`, { status });
    setTickets((prev) => prev.map((t) => t._id === id ? res.data.ticket : t));
    if (selectedTicket?._id === id) setSelectedTicket(res.data.ticket);
  };

  const handleDeleteTicket = async (id) => {
    if (!confirm('Delete this ticket?')) return;
    await api.delete(`/support/${id}`);
    setTickets((prev) => prev.filter((t) => t._id !== id));
    if (selectedTicket?._id === id) setSelectedTicket(null);
  };

  const toggleListingStatus = async (id, currentStatus) => {
    const status = currentStatus === 'active' ? 'inactive' : 'active';
    const res = await api.patch(`/admin/listings/${id}/status`, { status });
    setListings((prev) => prev.map((l) => l._id === id ? res.data.listing : l));
  };

  const toggleBanUser = async (id, isBanned) => {
    const res = await api.patch(`/admin/users/${id}/ban`, { isBanned: !isBanned });
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBanned: !isBanned } : u));
  };

  const handleAnnounce = async () => {
    if (!announceSubject.trim() || !announceMessage.trim()) return;
    setAnnounceSending(true);
    setAnnounceResult(null);
    try {
      const res = await api.post('/admin/announce', {
        target: announceTarget,
        subject: announceSubject,
        message: announceMessage,
      });
      setAnnounceResult({ success: true, text: `Sent to ${res.data.sent} recipient(s).` });
      setAnnounceSubject('');
      setAnnounceMessage('');
    } catch (err) {
      setAnnounceResult({ success: false, text: err.response?.data?.message || 'Failed to send.' });
    } finally {
      setAnnounceSending(false);
    }
  };

  const TABS = [
    { key: 'tickets', label: 'Support tickets', icon: LifeBuoy, count: tickets.filter((t) => t.status === 'open').length },
    { key: 'listings', label: 'Listings', icon: CheckCircle },
    { key: 'users', label: 'Users', icon: Ban },
    { key: 'areas', label: 'Featured areas', icon: MapPin },
    { key: 'announce', label: 'Announce', icon: Megaphone },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-6">Admin panel</h1>

      <div className="flex gap-1 border-b border-paper-200 mb-6">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === key ? 'border-teal-500 text-teal-600' : 'border-transparent text-ink-500'}`}>
            <Icon size={15} />
            {label}
            {count > 0 && (
              <span className="h-5 min-w-5 px-1 rounded-full bg-coral-500 text-white text-xs flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-3" />)}

      {/* Support Tickets */}
      {!loading && tab === 'tickets' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ticket list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-ink-500">{tickets.length} total · {tickets.filter(t => t.status === 'open').length} open</p>
            </div>
            {tickets.length === 0 && <p className="text-ink-500 text-sm">No tickets yet.</p>}
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                className={`p-4 rounded-card border cursor-pointer transition-all
                  ${selectedTicket?._id === t._id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-paper-200 bg-paper-50 hover:border-teal-300'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {t.userId?.name} ({t.userId?.role}) · {t.category?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge variant={STATUS_COLOR[t.status]} className="text-xs capitalize">
                      {t.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={PRIORITY_COLOR[t.priority]} className="text-xs capitalize">
                      {t.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-ink-400 mt-2 truncate">{t.message}</p>
                <p className="text-xs text-ink-300 mt-1">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* Ticket detail + reply */}
          <div>
            {selectedTicket ? (
              <div className="sticky top-24 bg-paper-50 border border-paper-200 rounded-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{selectedTicket.subject}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      From: {selectedTicket.userId?.name} — {selectedTicket.userId?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket._id)}
                    className="p-1.5 text-ink-400 hover:text-danger-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="bg-paper-100 rounded-control p-3">
                  <p className="text-xs font-medium text-ink-500 mb-1 capitalize">
                    {selectedTicket.category?.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {selectedTicket.adminReply && (
                  <div className="bg-teal-50 border border-teal-100 rounded-control p-3">
                    <p className="text-xs font-medium text-teal-700 mb-1">Your previous reply</p>
                    <p className="text-sm text-teal-800 whitespace-pre-wrap">{selectedTicket.adminReply}</p>
                  </div>
                )}

                {/* Status quick-change */}
                <div className="flex gap-2">
                  {['open', 'in_review', 'resolved', 'closed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleTicketStatus(selectedTicket._id, s)}
                      className={`px-2 py-1 rounded-pill text-xs capitalize transition-colors
                        ${selectedTicket.status === s
                          ? 'bg-teal-500 text-white'
                          : 'bg-paper-200 text-ink-600 hover:bg-paper-300'}`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Reply form */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink-700">Reply to user</label>
                  <textarea
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full rounded-control border border-paper-300 bg-paper-50 p-3 text-sm
                      resize-none focus-visible:outline-2 focus-visible:outline-teal-500"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="h-9 text-sm rounded-control border border-paper-300 bg-paper-50 px-2"
                    >
                      <option value="in_review">Mark In Review</option>
                      <option value="resolved">Mark Resolved</option>
                      <option value="closed">Mark Closed</option>
                    </select>
                    <Button onClick={handleReply} disabled={sending || !reply.trim()} size="sm" className="flex-1">
                      {sending ? 'Sending...' : 'Send reply'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border border-dashed border-paper-300 rounded-card">
                <p className="text-ink-400 text-sm">Select a ticket to view and reply</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listings tab */}
      {!loading && tab === 'listings' && (
        <div className="space-y-3">
          {listings.length === 0 && <p className="text-ink-500">No listings found.</p>}
          {listings.map((l) => (
            <div key={l._id} className="bg-paper-50 border border-paper-200 rounded-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{l.title}</p>
                <p className="text-xs text-ink-500">{l.ownerId?.name} · Rs {l.rent?.toLocaleString()}/mo</p>
              </div>
              <Badge variant={l.status === 'active' ? 'success' : 'neutral'} className="capitalize shrink-0">
                {l.status}
              </Badge>
              <button
                onClick={() => toggleListingStatus(l._id, l.status)}
                className="p-1.5 text-ink-500 hover:text-danger-500 shrink-0"
                title={l.status === 'active' ? 'Deactivate' : 'Activate'}
              >
                {l.status === 'active' ? <Trash2 size={16} /> : <CheckCircle size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Users tab */}
      {!loading && tab === 'users' && (
        <div className="space-y-3">
          {users.length === 0 && <p className="text-ink-500">No users found.</p>}
          {users.map((u) => (
            <div key={u._id} className="bg-paper-50 border border-paper-200 rounded-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-ink-500">{u.email} · {u.role}</p>
              </div>
              {u.isBanned && <Badge variant="neutral">Banned</Badge>}
              {u.role !== 'admin' && (
                <button
                  onClick={() => toggleBanUser(u._id, u.isBanned)}
                  className={`p-1.5 shrink-0 ${u.isBanned ? 'text-success-500' : 'text-ink-500 hover:text-danger-500'}`}
                  title={u.isBanned ? 'Unban' : 'Ban user'}
                >
                  <Ban size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Announce tab */}
      {!loading && tab === 'announce' && (
        <div className="grid md:grid-cols-2 gap-6">

          {/* Form side */}
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-medium mb-1">Send announcement</h2>
              <p className="text-sm text-ink-500">
                Email all users, listers, or seekers at once.
              </p>
            </div>

            {announceResult && (
              <div className={`rounded-card p-3 text-sm ${
                announceResult.success
                  ? 'bg-teal-50 border border-teal-100 text-teal-700'
                  : 'bg-red-50 border border-red-100 text-red-700'
              }`}>
                {announceResult.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Send to</label>
              <select
                value={announceTarget}
                onChange={(e) => setAnnounceTarget(e.target.value)}
                className="w-full h-11 rounded-control border border-paper-300 bg-paper-50 px-3 text-sm"
              >
                <option value="all">All users (seekers + listers)</option>
                <option value="owner">Listers (owners) only</option>
                <option value="seeker">Seekers only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Subject</label>
              <input
                type="text"
                value={announceSubject}
                onChange={(e) => setAnnounceSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full h-11 rounded-control border border-paper-300 bg-paper-50 px-3 text-sm
                  focus-visible:outline-2 focus-visible:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Message</label>
              <textarea
                rows={6}
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
                placeholder="Write your announcement message here..."
                className="w-full rounded-control border border-paper-300 bg-paper-50 p-3 text-sm
                  resize-none focus-visible:outline-2 focus-visible:outline-teal-500"
              />
            </div>

            <Button
              onClick={handleAnnounce}
              disabled={announceSending || !announceSubject.trim() || !announceMessage.trim()}
              size="sm"
              className="w-full"
              icon={Megaphone}
            >
              {announceSending ? 'Sending...' : 'Send announcement'}
            </Button>
          </div>

          {/* Recipients preview side */}
          {(() => {
            const recipients = announceTarget === 'all'
              ? users.filter(u => u.role !== 'admin')
              : users.filter(u => u.role === announceTarget);
            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-medium">Recipients</h2>
                  <span className="text-xs bg-teal-100 text-teal-700 font-medium px-2 py-0.5 rounded-pill">
                    {recipients.length} {recipients.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
                {recipients.length === 0 ? (
                  <div className="flex items-center justify-center h-32 border border-dashed border-paper-300 rounded-card">
                    <p className="text-xs text-ink-400 italic">No recipients for this selection.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {recipients.map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center gap-3 bg-paper-50 border border-paper-200 rounded-control px-3 py-2.5"
                      >
                        {/* Avatar placeholder */}
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0 uppercase">
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">{u.name}</p>
                          <p className="text-xs text-ink-500 truncate">{u.email}</p>
                        </div>
                        <Badge
                          variant={u.role === 'owner' ? 'teal' : 'neutral'}
                          className="text-xs capitalize shrink-0"
                        >
                          {u.role === 'owner' ? 'Lister' : 'Seeker'}
                        </Badge>
                        {u.isBanned && (
                          <Badge variant="coral" className="text-xs shrink-0">Banned</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;