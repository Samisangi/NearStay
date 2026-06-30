import { createSlice } from '@reduxjs/toolkit';

// Minimal stub for now - expanded with full filter/radius/results state
// when we build the Search/Browse page.
const initialState = {
  filters: {
    minRent: null,
    maxRent: null,
    roomType: null,
    amenities: [],
    radius: 2000, // meters
    sortBy: 'distance',
  },
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setFilters } = searchSlice.actions;
export default searchSlice.reducer;
