// Location types for autocomplete and geolocation

export interface LocationSuggestion {
  id?: string;
  formattedAddress: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export interface LocationAutocompleteResponse {
  success: boolean;
  data: LocationSuggestion[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationFilters {
  userLatitude?: number;
  userLongitude?: number;
  maxDistance?: number;
  sortByDistance?: boolean;
}
