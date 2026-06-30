import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer from '../../redux/authSlice';
import ProtectedRoute from './ProtectedRoute';

// Builds a Redux store pre-seeded with a given auth state, so each test
// can simulate "logged out", "seeker logged in", "owner logged in", etc.
const buildStore = (authState) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  });

const renderWithAuth = (authState, allowedRoles) => {
  const store = buildStore(authState);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/" element={<div>Home page</div>} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<div>Secret content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute', () => {
  it('shows a loading state while session status is idle (does not redirect prematurely)', () => {
    renderWithAuth({ user: null, accessToken: null, status: 'idle' });
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    renderWithAuth({ user: null, accessToken: null, status: 'unauthenticated' });
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders protected content when authenticated with no role restriction', () => {
    renderWithAuth(
      { user: { id: '1', role: 'seeker' }, accessToken: 'tok', status: 'authenticated' },
      undefined
    );
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('allows access when user role matches allowedRoles', () => {
    renderWithAuth(
      { user: { id: '1', role: 'owner' }, accessToken: 'tok', status: 'authenticated' },
      ['owner']
    );
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('blocks access and redirects home when user role does NOT match allowedRoles', () => {
    renderWithAuth(
      { user: { id: '1', role: 'seeker' }, accessToken: 'tok', status: 'authenticated' },
      ['owner']
    );
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('blocks an admin route from a non-admin user', () => {
    renderWithAuth(
      { user: { id: '1', role: 'owner' }, accessToken: 'tok', status: 'authenticated' },
      ['admin']
    );
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });
});
