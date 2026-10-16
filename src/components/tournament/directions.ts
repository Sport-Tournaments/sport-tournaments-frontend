export interface DirectionsTarget {
  latitude?: number | string | null;
  longitude?: number | string | null;
  address?: string | null;
  placeId?: string | null;
}

function toCoordinate(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

export function getCoordinates(target: DirectionsTarget): { lat: number; lng: number } | null {
  const lat = toCoordinate(target.latitude);
  const lng = toCoordinate(target.longitude);
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

/**
 * Google Maps directions URL (works on web and opens the app on mobile).
 * Prefers coordinates, falls back to the address. Returns null when neither exists.
 */
export function getGoogleDirectionsUrl(target: DirectionsTarget): string | null {
  const coords = getCoordinates(target);
  const destination = coords ? `${coords.lat},${coords.lng}` : target.address?.trim();
  if (!destination) return null;

  const params = new URLSearchParams({ api: '1', destination });
  if (target.placeId) params.set('destination_place_id', target.placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function getWazeDirectionsUrl(target: DirectionsTarget): string | null {
  const coords = getCoordinates(target);
  if (coords) {
    return `https://waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;
  }
  const address = target.address?.trim();
  if (!address) return null;
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}
