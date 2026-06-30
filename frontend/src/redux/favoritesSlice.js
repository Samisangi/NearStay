import { createSlice } from '@reduxjs/toolkit';

// Minimal stub - expanded with optimistic update/rollback logic when we
// build the favorites heart-toggle feature on listing cards.
const initialState = {
  ids: [], // listingIds the current user has favorited
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavoriteIds: (state, action) => {
      state.ids = action.payload;
    },
    toggleFavoriteLocal: (state, action) => {
      const id = action.payload;
      state.ids = state.ids.includes(id)
        ? state.ids.filter((x) => x !== id)
        : [...state.ids, id];
    },
  },
});

export const { setFavoriteIds, toggleFavoriteLocal } = favoritesSlice.actions;
export default favoritesSlice.reducer;
