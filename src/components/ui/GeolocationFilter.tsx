'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/utils/helpers';
import Button from './Button';
import { getCurrentLocation, formatDistance } from '@/services/location.service';
import type { UserLocation, GeolocationFilters } from '@/types';
import { useToast } from '@/hooks';

export interface GeolocationFilterProps {
  className?: string;
  value?: GeolocationFilters;
  onChange?: (filters: GeolocationFilters) => void;
  maxDistanceOptions?: number[];
  defaultMaxDistance?: number;
  showSortOption?: boolean;
}

const DEFAULT_DISTANCE_OPTIONS = [10, 25, 50, 100, 250, 500];

export default function GeolocationFilter({
  className,
  value,
  onChange,
  maxDistanceOptions = DEFAULT_DISTANCE_OPTIONS,
  defaultMaxDistance = 50,
  showSortOption = true,
}: GeolocationFilterProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | undefined>(
    value?.maxDistance ?? undefined
  );
  const [sortByDistance, setSortByDistance] = useState(value?.sortByDistance ?? false);
  const [isEnabled, setIsEnabled] = useState(
    !!(value?.userLatitude && value?.userLongitude)
  );
  const { showToast } = useToast();

  // Request user location
  const requestLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setIsEnabled(true);

      // Trigger onChange with location
      onChange?.({
        userLatitude: location.latitude,
        userLongitude: location.longitude,
        maxDistance: maxDistance,
        sortByDistance,
      });

      showToast('success', 'Location enabled');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to get your location';
      setLocationError(message);
      showToast('error', message);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [maxDistance, sortByDistance, onChange, showToast]);

  // Clear location
  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setIsEnabled(false);
    setLocationError(null);
    onChange?.({
      userLatitude: undefined,
      userLongitude: undefined,
      maxDistance: undefined,
      sortByDistance: false,
    });
  }, [onChange]);

  // Handle max distance change
  const handleMaxDistanceChange = useCallback(
    (distance: number | undefined) => {
      setMaxDistance(distance);
      if (userLocation && isEnabled) {
        onChange?.({
          userLatitude: userLocation.latitude,
          userLongitude: userLocation.longitude,
          maxDistance: distance,
          sortByDistance,
        });
      }
    },
    [userLocation, isEnabled, sortByDistance, onChange]
  );

  // Handle sort toggle
  const handleSortToggle = useCallback(() => {
    const newSort = !sortByDistance;
    setSortByDistance(newSort);
    if (userLocation && isEnabled) {
      onChange?.({
        userLatitude: userLocation.latitude,
        userLongitude: userLocation.longitude,
        maxDistance,
        sortByDistance: newSort,
      });
    }
  }, [userLocation, isEnabled, maxDistance, sortByDistance, onChange]);

  // Sync external value changes
  useEffect(() => {
    if (value?.userLatitude && value?.userLongitude) {
      setUserLocation({
        latitude: value.userLatitude,
        longitude: value.userLongitude,
      });
      setIsEnabled(true);
    }
    setMaxDistance(value?.maxDistance);
    setSortByDistance(value?.sortByDistance ?? false);
  }, [value?.userLatitude, value?.userLongitude, value?.maxDistance, value?.sortByDistance]);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="font-medium text-gray-900">Location Filter</h3>
        </div>

        {isEnabled && (
          <button
            onClick={clearLocation}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {!isEnabled ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Enable location to find tournaments near you
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={requestLocation}
            isLoading={isLoadingLocation}
            className="w-full"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            Use My Location
          </Button>
          {locationError && (
            <p className="text-sm text-red-500">{locationError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Location indicator */}
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Location enabled</span>
          </div>

          {/* Distance filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Distance
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleMaxDistanceChange(undefined)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full border transition-colors',
                  maxDistance === undefined
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-primary/5'
                )}
              >
                Any
              </button>
              {maxDistanceOptions.map((distance) => (
                <button
                  key={distance}
                  onClick={() => handleMaxDistanceChange(distance)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full border transition-colors',
                    maxDistance === distance
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-primary/5'
                  )}
                >
                  {formatDistance(distance)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort by distance toggle */}
          {showSortOption && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Sort by distance
              </span>
              <button
                role="switch"
                aria-checked={sortByDistance}
                onClick={handleSortToggle}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  sortByDistance ? 'bg-indigo-600' : 'bg-white'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    sortByDistance ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for toolbar/filter bars
export interface GeolocationFilterCompactProps {
  className?: string;
  value?: GeolocationFilters;
  onChange?: (filters: GeolocationFilters) => void;
}

export function GeolocationFilterCompact({
  className,
  value,
  onChange,
}: GeolocationFilterCompactProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { showToast } = useToast();

  const isEnabled = !!(value?.userLatitude && value?.userLongitude);

  const toggleLocation = useCallback(async () => {
    if (isEnabled) {
      // Clear location
      onChange?.({
        userLatitude: undefined,
        userLongitude: undefined,
        maxDistance: undefined,
        sortByDistance: false,
      });
      setUserLocation(null);
      return;
    }

    // Request location
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      onChange?.({
        userLatitude: location.latitude,
        userLongitude: location.longitude,
        sortByDistance: true,
      });
      showToast('success', 'Showing nearest tournaments');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to get your location';
      showToast('error', message);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [isEnabled, onChange, showToast]);

  return (
    <Button
      variant={isEnabled ? 'primary' : 'outline'}
      size="sm"
      onClick={toggleLocation}
      isLoading={isLoadingLocation}
      className={className}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      {isEnabled ? 'Near Me' : 'Find Nearby'}
    </Button>
  );
}
