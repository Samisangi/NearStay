import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null, // { id, name, email, role, profilePicture }
  accessToken: null,
  // 'idle' = haven't checked yet, 'loading' = checking session on app load,
  // 'authenticated' / 'unauthenticated' = resolved. ProtectedRoute waits
  // for 'idle'/'loading' to resolve before deciding to redirect, so a
  // logged-in user isn't bounced to /login during the initial refresh check.
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.status = 'authenticated';
    },
    // Used after a silent refresh-token call that only returns a new accessToken
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.status = 'authenticated';
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    authChecking: (state) => {
      state.status = 'loading';
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { setCredentials, setAccessToken, updateUser, authChecking, logout } =
  authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectAuthStatus = (state) => state.auth.status;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
