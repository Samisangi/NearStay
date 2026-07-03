/**
 * Geocode a human-readable address to [lng, lat] coordinates
 * using the Nominatim (OpenStreetMap) free geocoding API.
 *
 * Usage policy requires a descriptive User-Agent. Set it in .env:
 *   NOMINATIM_USER_AGENT=NearStay/1.0 (your_email@example.com)
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

/**
 * @param {string} address - The address to geocode
 * @returns {Promise<[number, number]>} - [longitude, latitude] (GeoJSON order)
 * @throws {Error} if the address cannot be geocoded
 */
export async function geocodeAddress(address) {
  const userAgent =
    process.env.NOMINATIM_USER_AGENT || 'NearStay/1.0 (contact@nearstay.com)';

  // Detect unconfigured placeholder — Nominatim will 403 or ban placeholder UAs
  if (userAgent.includes('your_contact_email')) {
    throw new Error(
      'Geocoding is not configured. Set NOMINATIM_USER_AGENT in your .env file with a real email address.'
    );
  }

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': userAgent,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        'Geocoding failed (403): Nominatim rejected the request. Ensure NOMINATIM_USER_AGENT in .env has a real app name and contact email.'
      );
    }
    throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
  }

  const results = await response.json();

  if (!results || results.length === 0) {
    throw new Error(`Could not geocode address: "${address}"`);
  }

  const { lon, lat } = results[0];
  // MongoDB / GeoJSON expects [longitude, latitude]
  return [parseFloat(lon), parseFloat(lat)];
}
