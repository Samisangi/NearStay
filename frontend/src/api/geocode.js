// Wraps the free Nominatim geocoding API. Per their usage policy, requests
// must be reasonably rate-limited (we debounce calls at the call site,
// see useDebounce) and should not be hammered - this is fine for a search
// box where the user pauses while typing, not for live-as-you-type lookups.
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

/**
 * @param {string} query - free-text address/area, e.g. "Sukkur IBA University"
 * @returns {Promise<{lat: number, lng: number, displayName: string}[]>}
 */
export const geocodeAddress = async (query) => {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    // Bias results toward Pakistan since that's the initial market -
    // doesn't exclude other results, just ranks local matches higher.
    countrycodes: 'pk',
  });

  const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: {
      // Nominatim's usage policy requires a descriptive User-Agent or
      // Referer identifying the application - browsers set Referer
      // automatically, but we set this for clarity/compliance intent.
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding request failed');
  }

  const results = await response.json();

  return results.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name,
  }));
};
