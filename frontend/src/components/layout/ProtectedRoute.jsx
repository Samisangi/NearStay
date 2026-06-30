import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthStatus, selectCurrentUser } from '../../redux/authSlice';

/**
 * Usage:
 *   <Route element={<ProtectedRoute />}>           // any logged-in user
 *   <Route element={<ProtectedRoute allowedRoles={['owner']} />}>  // owner only
 *   <Route element={<ProtectedRoute allowedRoles={['admin']} />}>  // admin only
 *
 * Renders <Outlet/> (the matched child route) when allowed, otherwise redirects.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // Still checking the session (silent refresh in flight) - don't redirect
  // yet, or a logged-in user gets bounced to /login on every page reload.
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-paper-300 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    // Remember where they were headed so login can send them back after.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
