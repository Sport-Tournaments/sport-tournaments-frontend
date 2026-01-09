import { apiGet } from './api';
import type {
  LocationSuggestion,
  LocationAutocompleteResponse,
  UserLocation,
} from '@/types';

const LOCATIONS_BASE = '/v1/locations';

// Search locations with autocomplete
export async function searchLocations(
  query: string,
  limit = 5
): Promise<LocationAutocompleteResponse> {
  if (!query || query.length < 2) {
    return { success: true, data: [] };
  }
  return apiGet<LocationAutocompleteResponse>(
    `${LOCATIONS_BASE}/autocomplete?query=${encodeURIComponent(query)}&limit=${limit}`
  );
}

// Get user's current location using browser geolocation API
export function getCurrentLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    // Check if geolocation permission is available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          reject(new Error('Location permission denied. Please enable location access in your browser settings.'));
          return;
        }
      }).catch((err) => {
        console.warn('Permissions API not fully supported:', err);
        // Continue with geolocation request anyway
      });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      }),
      (error) => {
        let message = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 15000, // Increased timeout
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

// Calculate distance between two points using Haversine formula (in km)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

export const locationService = {
  searchLocations,
  getCurrentLocation,
  calculateDistance,
  formatDistance,
};

export default locationService;
