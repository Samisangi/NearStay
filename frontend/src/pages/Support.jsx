import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  LifeBuoy, Plus, ChevronDown, ChevronUp,
  Clock, CheckCircle, AlertCircle, XCircle,
} from 'lucide-react';
import { selectCurrentUser } from '../redux/authSlice';
import api from '../api/axiosInstance';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

const CATEGORIES = [
  { value: 'complaint', label: 'Complaint about a user/listing' },
  { value: 'bug', label: 'Bug or technical issue' },
  { value: 'listing_issue', label: 'Problem with a listing' },
  { value: 'account', label: 'Account issue' },
  { value: 'billing', label: 'Billing / payment' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  open:      { color: 'coral',   icon: Clock,        label: 'Open' },
  in_review: { color: 'teal',    icon: AlertCircle,  label: 'In Review' },
  resolved:  { color: 'success', icon: CheckCircle,  label: 'Resolved' },
  closed:    { color: 'neutral', icon: XCircle,      label: 'Closed' },
};

const TicketCard = ({ ticket }) => {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;

  return (
    <div className="bg-paper-50 border border-paper-200 rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-paper-100 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-ink-900">{ticket.subject}</p>
            <Badge variant={cfg.color} className="flex items-center gap-1 text-xs">
              <Icon size={11} />{cfg.label}
            </Badge>
          </div>
          <p className="text-xs text-ink-500 mt-1 capitalize">
            {ticket.category.replace('_', ' ')} ·{' '}
            {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
          {!open && (
            <p className="text-xs text-ink-400 mt-1 truncate">{ticket.message}</p>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-ink-400 shrink-0 mt-0.5" /> :
                <ChevronDown size={16} className="text-ink-400 shrink-0 mt-0.5" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-paper-100">
          <div className="pt-3">
            <p className="text-xs font-medium text-ink-500 mb-1">Your message</p>
            <p className="text-sm text-ink-700 whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {ticket.adminReply ? (
            <div className="bg-teal-50 border border-teal-100 rounded-control p-3">
              <p className="text-xs font-medium text-teal-700 mb-1">
                Admin reply · {ticket.repliedAt ? new Date(ticket.repliedAt).toLocaleDateString() : ''}
              </p>
              <p className="text-sm text-teal-800 whitespace-pre-wrap">{ticket.adminReply}</p>
            </div>
          ) : (
            <p className="text-xs text-ink-400 italic">
              No reply yet — our team typically responds within 24 hours.
            </p>
          )}

          {ticket.relatedListingId && (
            <p className="text-xs text-ink-500">
              Related listing: <span className="font-medium">{ticket.relatedListingId.title}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const Support = () => {
  const user = useSelector(selectCurrentUser);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    setLoading(true);
    const params = filter !== 'all' ? `?status=${filter}` : '';
    const endpoint = user?.role === 'admin'
      ? `/support/all${params}`
      : `/support/mine${params}`;

    api.get(endpoint)
      .then((res) => setTickets(res.data.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [filter, user?.role]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await api.post('/support', data);
      setTickets((prev) => [res.data.ticket, ...prev]);
      setSubmitted(true);
      setShowForm(false);
      reset();
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LifeBuoy size={22} className="text-teal-600" />
          <h1 className="text-2xl">Support</h1>
        </div>
        {user?.role !== 'admin' && (
          <Button
            size="sm"
            icon={Plus}
            onClick={() => setShowForm((v) => !v)}
            variant={showForm ? 'secondary' : 'primary'}
          >
            {showForm ? 'Cancel' : 'New ticket'}
          </Button>
        )}
      </div>
      <p className="text-ink-500 text-sm mb-8">
        {user?.role === 'admin'
          ? 'View and manage all support tickets from users and listers.'
          : user?.role === 'owner'
          ? 'Report a problem, complain about a seeker, or get help with your listings.'
          : 'Report a listing issue, complain about an owner, or get account help.'}
      </p>

      {submitted && (
        <div className="bg-teal-50 border border-teal-100 rounded-card p-4 mb-6 flex items-center gap-2 text-sm text-teal-700">
          <CheckCircle size={16} />
          Ticket submitted! Check your email for confirmation. We'll reply within 24 hours.
        </div>
      )}

      {/* New ticket form */}
      {showForm && (
        <div className="bg-paper-50 border border-paper-200 rounded-card p-5 mb-8">
          <h2 className="text-base font-medium mb-4">Submit a support ticket</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Subject"
              placeholder="Brief description of your issue"
              error={errors.subject?.message}
              {...register('subject', { required: 'Subject is required' })}
            />

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                Category
              </label>
              <select
                className="w-full h-11 rounded-control border border-paper-300 bg-paper-50 px-3 text-sm
                  focus-visible:outline-2 focus-visible:outline-teal-500"
                {...register('category')}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                Message
              </label>
              <textarea
                rows={5}
                placeholder={
                  user?.role === 'owner'
                    ? 'Describe the issue in detail. If complaining about a seeker, include their name or email if known...'
                    : 'Describe the issue in detail. If complaining about a listing or owner, include the listing title or owner name...'
                }
                className="w-full rounded-control border border-paper-300 bg-paper-50 p-3 text-sm
                  resize-none focus-visible:outline-2 focus-visible:outline-teal-500"
                {...register('message', {
                  required: 'Message is required',
                  minLength: { value: 20, message: 'Please provide more detail (at least 20 characters)' },
                })}
              />
              {errors.message && (
                <p className="mt-1.5 text-sm text-danger-500">{errors.message.message}</p>
              )}
            </div>

            {serverError && <p className="text-sm text-danger-500">{serverError}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Submitting...' : 'Submit ticket'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowForm(false); reset(); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">
            {user?.role === 'admin' ? `All tickets (${tickets.length})` : 'Your tickets'}
          </h2>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setLoading(true); }}
            className="h-8 text-xs rounded-control border border-paper-300 bg-paper-50 px-2"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="text-center py-12 border border-dashed border-paper-300 rounded-card">
            <LifeBuoy size={32} className="text-paper-300 mx-auto mb-3" />
            <p className="text-ink-500 text-sm">
              {user?.role === 'admin' ? 'No support tickets found.' : 'No tickets yet.'}
            </p>
            {user?.role !== 'admin' && (
              <button
                onClick={() => setShowForm(true)}
                className="text-teal-600 text-sm underline mt-1"
              >
                Submit your first ticket
              </button>
            )}
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((t) => <TicketCard key={t._id} ticket={t} />)}
          </div>
        )}
        {!loading && tickets.length > 0 && user?.role === 'admin' && (
  <div className="mt-4 p-3 bg-paper-100 rounded-card text-xs text-ink-500 text-center">
    Manage and reply to tickets from the{' '}
    <a href="/admin" className="text-teal-600 underline">Admin Panel</a>
    {' '}for full controls.
  </div>
)}
      </div>
    </div>
  );
};

export default Support;