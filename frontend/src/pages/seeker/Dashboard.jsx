import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare } from 'lucide-react';
import api from '../../api/axiosInstance';
import ListingCard from '../../components/listing/ListingCard';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

const SeekerDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/favorites'),
      api.get('/inquiries/seeker'),
    ])
      .then(([fRes, iRes]) => {
        setFavorites(fRes.data.listings || []);
        setInquiries(iRes.data.inquiries || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (id) => {
    await api.delete(`/favorites/${id}`);
    setFavorites((prev) => prev.filter((l) => l._id !== id));
  };

  const STATUS_COLOR = { pending: 'neutral', responded: 'teal', closed: 'neutral' };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-6">My dashboard</h1>

      <div className="flex gap-1 border-b border-paper-200 mb-6">
        {[
          { key: 'favorites', label: 'Saved rooms', icon: Heart },
          { key: 'inquiries', label: 'Inquiries', icon: MessageSquare },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === key ? 'border-teal-500 text-teal-600' : 'border-transparent text-ink-500'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
        </div>
      )}

      {!loading && tab === 'favorites' && (
        <>
          {favorites.length === 0 && (
            <div className="text-center py-16">
              <Heart size={32} className="text-paper-300 mx-auto mb-3" />
              <p className="text-ink-500">No saved rooms yet.</p>
              <button onClick={() => navigate('/search')} className="text-teal-600 text-sm underline mt-1">Browse rooms</button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {favorites.map((listing, i) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                index={i}
                isFavorited
                onToggleFavorite={removeFavorite}
                onClick={(l) => navigate(`/listings/${l._id}`)}
              />
            ))}
          </div>
        </>
      )}

      {!loading && tab === 'inquiries' && (
        <div className="space-y-3">
          {inquiries.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare size={32} className="text-paper-300 mx-auto mb-3" />
              <p className="text-ink-500">No inquiries sent yet.</p>
            </div>
          )}
          {inquiries.map((inq) => (
            <div key={inq._id}
              onClick={() => navigate(`/listings/${inq.listingId?._id}`)}
              className="bg-paper-50 border border-paper-200 rounded-card p-4 flex gap-4 cursor-pointer hover:border-teal-300 transition-colors">
              <div className="h-14 w-20 bg-paper-200 rounded-control overflow-hidden shrink-0">
                {inq.listingId?.coverPhoto && (
                  <img src={inq.listingId.coverPhoto} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inq.listingId?.title || 'Listing removed'}</p>
                <p className="text-sm text-ink-500 mt-0.5 line-clamp-1">{inq.message}</p>
                <p className="text-xs text-ink-400 mt-1">
                  Owner: {inq.ownerId?.name} · {new Date(inq.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={STATUS_COLOR[inq.status]} className="capitalize shrink-0 self-start">
                {inq.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeekerDashboard;