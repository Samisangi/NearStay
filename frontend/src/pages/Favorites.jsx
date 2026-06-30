import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ListingCard from '../components/listing/ListingCard';
import Skeleton from '../components/ui/Skeleton';

const Favorites = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/favorites')
      .then((res) => setListings(res.data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id) => {
    await api.delete(`/favorites/${id}`);
    setListings((prev) => prev.filter((l) => l._id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-6">Saved rooms</h1>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <p className="text-ink-500">No saved rooms yet. Heart a listing to save it here.</p>
      )}

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map((listing, i) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              index={i}
              isFavorited
              onToggleFavorite={handleRemove}
              onClick={(l) => navigate(`/listings/${l._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;