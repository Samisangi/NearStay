import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../api/axiosInstance';
import { setCredentials, authChecking, logout } from '../redux/authSlice';

/**
 * On app mount, attempts a silent refresh using the httpOnly cookie.
 * If it succeeds, the user is still logged in from a previous session
 * (e.g. they refreshed the page) and we restore their access token +
 * profile without making them log in again. If it fails (no cookie,
 * expired, etc.) we just mark them as unauthenticated - this is the
 * normal logged-out state, not an error to surface to the user.
 */
export const useSessionRestore = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      dispatch(authChecking());
      try {
        const { data } = await api.post('/auth/refresh-token');
        // refresh-token only returns a new accessToken, not the user object,
        // so fetch the profile separately to populate state.user.
        const profileRes = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        dispatch(
          setCredentials({
            accessToken: data.accessToken,
            user: profileRes.data.user,
          })
        );
      } catch {
        dispatch(logout());
      }
    };

    restoreSession();
  }, [dispatch]);
};
