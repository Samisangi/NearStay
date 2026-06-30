import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, LayoutDashboard, MapPin, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { selectCurrentUser, selectIsAuthenticated, logout } from '../../redux/authSlice';
import api from '../../api/axiosInstance';
import Button from '../ui/Button';

const Navbar = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear client state regardless of whether the network call succeeded -
      // the user clicked logout, so the UI should reflect that immediately.
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-paper-50/90 backdrop-blur-sm border-b border-paper-200">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 font-display text-xl text-teal-500">
          <MapPin size={22} className="text-coral-500" aria-hidden="true" />
          NearStay
        </Link>

        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Sign up</Button>
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'seeker' && (
            <>
              <Link to="/favorites">
                <Button variant="ghost" size="sm" icon={Heart}>Favorites</Button>
              </Link>
              <Link to="/my-inquiries">
                <Button variant="ghost" size="sm" icon={MessageSquare}>Inquiries</Button>
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'owner' && (
            <Link to="/owner/dashboard">
              <Button variant="ghost" size="sm" icon={LayoutDashboard}>Dashboard</Button>
            </Link>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" icon={ShieldCheck}>Admin</Button>
            </Link>
          )}

          {isAuthenticated && (
            <>
              <Link to="/profile" aria-label="Profile">
                <div className="h-9 w-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User size={18} aria-hidden="true" />
                  )}
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
