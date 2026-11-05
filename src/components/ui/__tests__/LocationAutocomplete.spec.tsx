import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const searchLocations = vi.fn();
const searchLocationPredictions = vi.fn();
const getPlaceDetails = vi.fn();

vi.mock('@/services/location.service', () => ({
  searchLocations: (...args: unknown[]) => searchLocations(...args),
  searchLocationPredictions: (...args: unknown[]) => searchLocationPredictions(...args),
  getPlaceDetails: (...args: unknown[]) => getPlaceDetails(...args),
}));

import LocationAutocomplete from '../LocationAutocomplete';

describe('LocationAutocomplete (address mode) Places cost', () => {
  beforeEach(() => {
    searchLocations.mockReset();
    searchLocationPredictions.mockReset();
    getPlaceDetails.mockReset();
  });

  it('lists predictions and fetches details only for the picked one, in the same session', async () => {
    searchLocationPredictions.mockResolvedValue({
      success: true,
      data: [
        {
          placeId: 'p1',
          formattedAddress: 'Arena Nationala, Bucuresti, Romania',
          mainText: 'Arena Nationala',
          secondaryText: 'Bucuresti, Romania',
          venueName: 'Arena Nationala',
          isPointOfInterest: true,
        },
        { placeId: 'p2', formattedAddress: 'Arad, Romania', mainText: 'Arad', secondaryText: 'Romania' },
      ],
    });
    const details = {
      placeId: 'p2',
      formattedAddress: 'Arad, Romania',
      city: 'Arad',
      country: 'Romania',
      latitude: 46.18,
      longitude: 21.31,
    };
    getPlaceDetails.mockResolvedValue({ success: true, data: details });
    const onSelect = vi.fn();
    const onCoordinatesChange = vi.fn();

    render(
      <LocationAutocomplete
        displayMode="address"
        onSelect={onSelect}
        onCoordinatesChange={onCoordinatesChange}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ara' } });

    const option = await screen.findByText('Arad');
    expect(screen.getByText('Arena Nationala')).toBeInTheDocument();
    expect(getPlaceDetails).not.toHaveBeenCalled();
    expect(searchLocations).not.toHaveBeenCalled();

    fireEvent.click(option);

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(details));
    expect(onCoordinatesChange).toHaveBeenCalledWith(46.18, 21.31);
    expect(getPlaceDetails).toHaveBeenCalledTimes(1);
    const sessionToken = searchLocationPredictions.mock.calls[0][1];
    expect(sessionToken).toEqual(expect.any(String));
    expect(getPlaceDetails).toHaveBeenCalledWith('p2', sessionToken);
  });
});
