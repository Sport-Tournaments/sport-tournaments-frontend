import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const loadMock = vi.fn(() => new Promise(() => {})); // never resolves: we only count loads
const LoaderCtor = vi.fn();

vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: class {
    constructor(opts: unknown) {
      LoaderCtor(opts);
    }
    load = loadMock;
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, d?: string) => d ?? _k }),
}));

import GoogleMap from '../GoogleMap';

const tournaments = [
  { id: '1', name: 'Cup', latitude: 45.6, longitude: 25.6, startDate: '2026-11-01', endDate: '2026-11-02', status: 'PUBLISHED' },
] as never;

describe('GoogleMap cost guards', () => {
  beforeEach(() => {
    loadMock.mockClear();
    LoaderCtor.mockClear();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
  });

  it('loads immediately by default', async () => {
    render(<GoogleMap tournaments={tournaments} />);
    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(1));
  });

  it('does not load Google Maps until the visitor clicks "Show map"', async () => {
    render(<GoogleMap tournaments={tournaments} deferUntilClick />);
    expect(loadMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('google-map-placeholder'));

    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(1));
  });

  it('does not request the Places library', async () => {
    render(<GoogleMap tournaments={tournaments} />);
    await waitFor(() => expect(LoaderCtor).toHaveBeenCalled());
    expect(LoaderCtor.mock.calls[0][0]).not.toHaveProperty('libraries');
  });
});
