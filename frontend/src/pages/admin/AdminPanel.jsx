import { useEffect, useState } from 'react';
import { Ban, CheckCircle, Trash2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';

const AdminPanel = () => {
  const [tab, setTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/listings'), api.get('/admin/users')])
      .then(([lRes, uRes]) => {
        setListings(lRes.data.listings || []);
        setUsers(uRes.data.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleListingStatus = async (id, currentStatus) => {
    const status = currentStatus === 'active' ? 'inactive' : 'active';
    await api.patch(`/admin/listings/${id}/status`, { status });
    setListings((prev) => prev.map((l) => l._id === id ? { ...l, status } : l));
  };

  const toggleBanUser = async (id, isBanned) => {
    await api.patch(`/admin/users/${id}/ban`, { isBanned: !isBanned });
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBanned: !isBanned } : u));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-6">Admin panel</h1>

      <div className="flex gap-1 border-b border-paper-200 mb-6">
        {['listings', 'users'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors
              ${tab === t ? 'border-teal-500 text-teal-600' : 'border-transparent text-ink-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-3" />)}

      {!loading && tab === 'listings' && (
        <div className="space-y-3">
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
          {listings.length === 0 && <p className="text-ink-500">No listings found.</p>}
        </div>
      )}

      {!loading && tab === 'users' && (
        <div className="space-y-3">
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
                  title={u.isBanned ? 'Unban' : 'Ban'}
                >
                  <Ban size={16} />
                </button>
              )}
            </div>
          ))}
          {users.length === 0 && <p className="text-ink-500">No users found.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;