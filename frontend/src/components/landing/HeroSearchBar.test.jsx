import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HeroSearchBar from './HeroSearchBar';
import * as geocodeApi from '../../api/geocode';

// Capture the navigated-to path by rendering a catch-all route that
// displays the current location's search string.
const renderWithRouter = () => {
  let capturedSearch = '';
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HeroSearchBar />} />
        <Route
          path="/search"
          element={
            <SearchSpy onRender={(search) => (capturedSearch = search)} />
          }
        />
      </Routes>
    </MemoryRouter>
  );
  return {
    getCapturedSearch: () => capturedSearch,
  };
};

const SearchSpy = ({ onRender }) => {
  onRender(window.location.search || document.location.search);
  return <div>Search results page</div>;
};

describe('HeroSearchBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls geocodeAddress after the user pauses typing (debounced) and shows suggestions', async () => {
    const mockGeocode = vi
      .spyOn(geocodeApi, 'geocodeAddress')
      .mockResolvedValue([
        { lat: 27.72575, lng: 68.81913, displayName: 'Sukkur IBA University, Sukkur' },
      ]);

    const user = userEvent.setup();
    renderWithRouter();

    const input = screen.getByLabelText('Search by area or university');
    await user.type(input, 'Sukkur IBA');

    await waitFor(() => expect(mockGeocode).toHaveBeenCalledWith('Sukkur IBA'), {
      timeout: 1000,
    });

    await waitFor(() =>
      expect(screen.getByText('Sukkur IBA University, Sukkur')).toBeInTheDocument()
    );
  });

  it('navigates to /search with lat/lng when a suggestion is clicked', async () => {
    vi.spyOn(geocodeApi, 'geocodeAddress').mockResolvedValue([
      { lat: 27.72575, lng: 68.81913, displayName: 'Sukkur IBA University, Sukkur' },
    ]);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HeroSearchBar />} />
          <Route path="/search" element={<div>Landed on search page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByLabelText('Search by area or university');
    await user.type(input, 'Sukkur IBA');

    const suggestion = await screen.findByText('Sukkur IBA University, Sukkur');
    await user.click(suggestion);

    expect(await screen.findByText('Landed on search page')).toBeInTheDocument();
  });

  it('does not trigger geocoding for queries under 3 characters', async () => {
    const mockGeocode = vi.spyOn(geocodeApi, 'geocodeAddress').mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithRouter();

    const input = screen.getByLabelText('Search by area or university');
    await user.type(input, 'Su');

    // Wait past the debounce window to be sure it really never fires.
    // Using waitFor with a deliberately-failing assertion keeps this
    // inside React's act() batching, unlike a raw setTimeout.
    await waitFor(
      () => {
        expect(mockGeocode).not.toHaveBeenCalled();
      },
      { timeout: 600, interval: 50 }
    );
  });
});
