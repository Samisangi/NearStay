import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Map as MapIcon, List as ListIcon, SlidersHorizontal, Loader2 } from 'lucide-react';
import SearchMap from '../components/map/SearchMap';
import ListingCard from '../components/listing/ListingCard';
import Button from '../components/ui/Button';
import api from '../api/axiosInstance';
import { toggleFavoriteLocal, setFavoriteIds } from '../redux/favoritesSlice';
import { selectIsAuthenticated } from '../redux/authSlice';
import { cn } from '../lib/cn';

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance' },
  { value: 'rent_asc', label: 'Price: low to high' },
  { value: 'rent_desc', label: 'Price: high to low' },
];

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const favoriteIds = useSelector((s) => s.favorites.ids);

  const lat = parseFloat(searchParams.get('lat')) || null;
  const lng = parseFloat(searchParams.get('lng')) || null;
  const label = searchParams.get('label') || 'your area';

  const [mobileView, setMobileView] = useState('list');
  const [hoveredId, setHoveredId] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const [radius, setRadius] = useState(5);        // km
  const [maxRent, setMaxRent] = useState('');

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch listings from the real API ────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        status: 'active',
        sort: sortBy,
        radius,
        limit: 50,
      };

      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }

      if (maxRent) params.maxRent = maxRent;

      const res = await api.get('/listings/search', { params });
      setListings(res.data.listings || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Could not load listings. Please try again.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, sortBy, radius, maxRent]);

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // ── Load user's saved favorites ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/favorites/ids')
      .then((res) => {
        dispatch(setFavoriteIds(res.data.ids || []));
      })
      .catch(() => {}); // non-critical
  }, [isAuthenticated, dispatch]);

  // ── Toggle favorite ─────────────────────────────────────────────────────────
  const handleToggleFavorite = async (id) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(toggleFavoriteLocal(id)); // optimistic
    try {
      if (favoriteIds.includes(id)) {
        await api.delete(`/favorites/${id}`);
      } else {
        await api.post(`/favorites/${id}`);
      }
    } catch {
      dispatch(toggleFavoriteLocal(id)); // rollback on error
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Filter bar */}
      <div className="border-b border-paper-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-500 hidden sm:inline">Near</span>
        <span className="text-sm font-medium text-ink-900">{label}</span>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-control border border-paper-300 bg-paper-50 text-sm px-2"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Max rent"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            className="h-9 w-28 rounded-control border border-paper-300 bg-paper-50 text-sm px-2"
          />

          <div className="hidden sm:flex items-center gap-2 text-sm">
            <SlidersHorizontal size={14} className="text-ink-500" />
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-28"
            />
            <span className="text-xs text-ink-500 w-12">{radius} km</span>
          </div>

          {/* Mobile map/list toggle */}
          <div className="flex sm:hidden rounded-control border border-paper-300 overflow-hidden">
            <button
              onClick={() => setMobileView('list')}
              className={cn('px-3 h-9', mobileView === 'list' ? 'bg-teal-500 text-paper-50' : 'bg-paper-50')}
            >
              <ListIcon size={16} />
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={cn('px-3 h-9', mobileView === 'map' ? 'bg-teal-500 text-paper-50' : 'bg-paper-50')}
            >
              <MapIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Listings panel */}
        <div
          className={cn(
            'w-full sm:w-[45%] lg:w-[40%] overflow-y-auto p-4 sm:p-6',
            mobileView === 'map' && 'hidden sm:block'
          )}
        >
          {/* Status line */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-ink-500 mb-4">
              <Loader2 size={14} className="animate-spin" />
              <span>Finding rooms…</span>
            </div>
          ) : error ? (
            <p className="text-sm text-danger-500 mb-4">{error}</p>
          ) : (
            <p className="text-sm text-ink-500 mb-4">
              {total} room{total !== 1 ? 's' : ''} found
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                index={i}
                isFavorited={favoriteIds.includes(listing._id?.toString())}
                onToggleFavorite={handleToggleFavorite}
                onHover={setHoveredId}
                isHighlighted={hoveredId === listing._id}
                onClick={(l) => navigate(`/listings/${l._id}`)}
              />
            ))}

            {!loading && listings.length === 0 && !error && (
              <div className="col-span-full text-center py-10">
                <p className="text-sm text-ink-500">No rooms found in this area.</p>
                <p className="text-xs text-ink-400 mt-1">Try increasing the radius or removing filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map panel */}
        <div className={cn('flex-1 p-4 sm:p-6 pl-0 sm:pl-0', mobileView === 'list' && 'hidden sm:block')}>
          <SearchMap
            center={lat && lng ? [lat, lng] : [27.7032, 68.8589]}
            listings={listings}
            highlightedId={hoveredId}
            onMarkerHover={setHoveredId}
            onMarkerClick={(l) => navigate(`/listings/${l._id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default Search;
