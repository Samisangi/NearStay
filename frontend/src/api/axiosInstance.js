import axios from 'axios';
import { store } from '../redux/store';
import { setAccessToken, logout } from '../redux/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie cross-origin
});

// Attach the current access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tracks an in-flight refresh call so multiple requests that 401 at the
// same time don't each trigger their own /refresh-token call - they all
// wait on this one shared promise instead.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Only attempt a refresh on 401s, and only once per request
    // (the _retry flag prevents an infinite loop if refresh itself fails).
    if (response?.status === 401 && !config._retry) {
      config._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const refreshResponse = await refreshPromise;
        const newAccessToken = refreshResponse.data.accessToken;

        store.dispatch(setAccessToken(newAccessToken));

        // Retry the original request with the new token
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(config);
      } catch (refreshError) {
        // Refresh token itself is invalid/expired - the session is truly over.
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
