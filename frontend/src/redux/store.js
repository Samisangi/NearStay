import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import searchReducer from './searchSlice';
import favoritesReducer from './favoritesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
    favorites: favoritesReducer,
  },
});
