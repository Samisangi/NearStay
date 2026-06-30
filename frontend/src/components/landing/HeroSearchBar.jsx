import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, LocateFixed, Loader2 } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useDebounce } from '../../hooks/useDebounce';
import { useEffect } from 'react';
import { geocodeAddress } from '../../api/geocode';
import Button from '../ui/Button';

/**
 * The hero IS the search - typing an area or tapping "use my location"
 * navigates straight to /search with coordinates in the query string.
 * No intermediate "submit to search" marketing step.
 */
const HeroSearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const debouncedQuery = useDebounce(query, 450);
  const { status: geoStatus, coords, requestLocation, error: geoError } = useGeolocation();

  // Fetch suggestions as the user pauses while typing
  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setIsGeocoding(true);
    geocodeAddress(debouncedQuery)
      .then((results) => {
        if (!cancelled) setSuggestions(results);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsGeocoding(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // The moment geolocation succeeds, go straight to results - that's the
  // "drops straight into results" behavior the spec calls for.
  useEffect(() => {
    if (geoStatus === 'success' && coords) {
      navigate(`/search?lat=${coords.lat}&lng=${coords.lng}&label=${encodeURIComponent('Your location')}`);
    }
  }, [geoStatus, coords, navigate]);

  const handleSelectSuggestion = (s) => {
    navigate(`/search?lat=${s.lat}&lng=${s.lng}&label=${encodeURIComponent(s.displayName)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 bg-paper-50 rounded-full border border-paper-300 shadow-card p-1.5 pl-5 focus-within:border-teal-300 transition-colors">
          <Search size={20} className="text-ink-300 shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search near Sukkur IBA, Gulberg Lahore..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-ink-900 placeholder:text-ink-300 py-2.5"
            aria-label="Search by area or university"
          />
          <Button type="submit" size="md" className="rounded-full shrink-0">
            Search
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {(suggestions.length > 0 || isGeocoding) && query.trim().length >= 3 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-paper-50 rounded-2xl border border-paper-200 shadow-popover overflow-hidden z-10"
          >
            {isGeocoding && (
              <li className="px-5 py-3 text-sm text-ink-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Searching areas...
              </li>
            )}
            {!isGeocoding &&
              suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-5 py-3 text-sm text-ink-700 hover:bg-paper-100 transition-colors border-b border-paper-100 last:border-none"
                  >
                    {s.displayName}
                  </button>
                </li>
              ))}
          </motion.ul>
        )}
      </form>

      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          type="button"
          onClick={requestLocation}
          disabled={geoStatus === 'loading'}
          className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium disabled:opacity-60"
        >
          {geoStatus === 'loading' ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed size={15} aria-hidden="true" />
          )}
          Use my current location
        </button>
      </div>

      {geoStatus === 'error' && geoError && (
        <p className="text-center text-sm text-danger-500 mt-2">{geoError}</p>
      )}
    </div>
  );
};

export default HeroSearchBar;
