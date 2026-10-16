import { describe, expect, it } from 'vitest';
import { getGoogleDirectionsUrl, getWazeDirectionsUrl } from '../directions';

describe('directions URLs', () => {
  it('uses coordinates (and place id) when available', () => {
    const url = new URL(getGoogleDirectionsUrl({ latitude: '44.437', longitude: 26.152, placeId: 'abc' })!);
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('destination')).toBe('44.437,26.152');
    expect(url.searchParams.get('destination_place_id')).toBe('abc');
    expect(getWazeDirectionsUrl({ latitude: 44.437, longitude: 26.152 })).toBe(
      'https://waze.com/ul?ll=44.437,26.152&navigate=yes',
    );
  });

  it('falls back to the address', () => {
    const url = new URL(getGoogleDirectionsUrl({ address: 'Arena Nationala, Bucuresti' })!);
    expect(url.searchParams.get('destination')).toBe('Arena Nationala, Bucuresti');
    expect(getWazeDirectionsUrl({ address: 'Arena Nationala' })).toBe(
      'https://waze.com/ul?q=Arena%20Nationala&navigate=yes',
    );
  });

  it('returns null without coordinates or address', () => {
    expect(getGoogleDirectionsUrl({ latitude: 'x', longitude: null, address: '  ' })).toBeNull();
    expect(getWazeDirectionsUrl({})).toBeNull();
  });
});
