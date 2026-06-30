import { useState, useCallback } from 'react';

/**
 * Wraps navigator.geolocation.getCurrentPosition in a hook with loading/
 * error states. Does NOT request location on mount - call requestLocation()
 * from a user gesture (e.g. button click), since browsers treat unsolicited
 * geolocation prompts on page load as a strong signal to auto-deny.
 */
export const useGeolocation = () => {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus('success');
      },
      (err) => {
        // err.code: 1 = permission denied, 2 = position unavailable, 3 = timeout
        const messages = {
          1: 'Location access was denied. You can type your area instead.',
          2: 'Could not determine your location. Try typing your area instead.',
          3: 'Location request timed out. Try typing your area instead.',
        };
        setError(messages[err.code] || 'Could not get your location.');
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { status, coords, error, requestLocation };
};
