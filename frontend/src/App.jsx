import { Routes, Route } from 'react-router-dom';
import { useSessionRestore } from './hooks/useSessionRestore';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Landing from './pages/Landing';
import Search from './pages/Search';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import MyInquiries from './pages/MyInquiries';
import OwnerDashboard from './pages/owner/Dashboard';
import AdminPanel from './pages/admin/AdminPanel';
import NotFound from './pages/NotFound';

function App() {
  // Attempts to silently restore a session via the refresh-token cookie
  // on first load, so a page refresh doesn't log the user out.
  useSessionRestore();

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Any authenticated user (seeker, owner, or admin) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Seeker-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['seeker']} />}>
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-inquiries" element={<MyInquiries />} />
        </Route>

        {/* Owner-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/listings/new" element={<CreateListing />} />
          <Route path="/owner/listings/:id/edit" element={<CreateListing />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* 404 - must be last */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
