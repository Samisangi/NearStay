import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Map as MapIcon, List as ListIcon, SlidersHorizontal } from 'lucide-react';
import SearchMap from '../components/map/SearchMap';
import ListingCard from '../components/listing/ListingCard';
import Button from '../components/ui/Button';
import { MOCK_LISTINGS } from '../mocks/listings';
import { cn } from '../lib/cn';

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
];

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lat = parseFloat(searchParams.get('lat')) || 27.7032;
  const lng = parseFloat(searchParams.get('lng')) || 68.8589;
  const label = searchParams.get('label') || 'Sukkur';

  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'
  const [hoveredId, setHoveredId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('distance');
  const [radius, setRadius] = useState(5000);
  const [maxRent, setMaxRent] = useState('');

  // TODO: replace with real GET /api/listings/search?lat=&lng=&maxDistance=... call
  const listings = useMemo(() => {
    let result = MOCK_LISTINGS.filter((l) => l.distance <= radius);
    if (maxRent) result = result.filter((l) => l.rent <= parseFloat(maxRent));
    if (sortBy === 'price_low') result = [...result].sort((a, b) => a.rent - b.rent);
    else if (sortBy === 'price_high') result = [...result].sort((a, b) => b.rent - a.rent);
    else result = [...result].sort((a, b) => a.distance - b.distance);
    return result;
  }, [radius, maxRent, sortBy]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
              min={500}
              max={10000}
              step={500}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-28"
            />
            <span className="distance-figure text-xs text-ink-500 w-12">
              {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`}
            </span>
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
        <div
          className={cn(
            'w-full sm:w-[45%] lg:w-[40%] overflow-y-auto p-4 sm:p-6',
            mobileView === 'map' && 'hidden sm:block'
          )}
        >
          <p className="text-sm text-ink-500 mb-4">{listings.length} rooms found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                index={i}
                isFavorited={favorites.includes(listing._id)}
                onToggleFavorite={toggleFavorite}
                onHover={setHoveredId}
                isHighlighted={hoveredId === listing._id}
                onClick={(l) => navigate(`/listings/${l._id}`)}
              />
            ))}
            {listings.length === 0 && (
              <p className="text-sm text-ink-500 col-span-full">No rooms match these filters - try widening the radius.</p>
            )}
          </div>
        </div>

        <div className={cn('flex-1 p-4 sm:p-6 pl-0 sm:pl-0', mobileView === 'list' && 'hidden sm:block')}>
          <SearchMap
            center={[lat, lng]}
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
