'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/utils/helpers';
import { useDebounce } from '@/hooks';
import { searchLocations } from '@/services/location.service';
import type { LocationSuggestion } from '@/types';

export interface LocationAutocompleteProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  containerClassName?: string;
  value?: string;
  onChange?: (location: string) => void;
  onSelect?: (location: LocationSuggestion) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

export default function LocationAutocomplete({
  label,
  error,
  helperText,
  placeholder = 'Search for a location...',
  required,
  containerClassName,
  value = '',
  onChange,
  onSelect,
  onCoordinatesChange,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(inputValue, 300);

  // Fetch suggestions when query changes
  useEffect(() => {
    async function fetchSuggestions() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchLocations(debouncedQuery);
        if (response.success) {
          // Remove duplicates based on city + region + country
          const uniqueSuggestions = response.data.reduce((acc, current) => {
            const key = `${current.city}-${current.region || ''}-${current.country}`;
            const existing = acc.find(item => 
              `${item.city}-${item.region || ''}-${item.country}` === key
            );
            if (!existing) {
              acc.push(current);
            }
            return acc;
          }, [] as LocationSuggestion[]);
          
          setSuggestions(uniqueSuggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSuggestions();
  }, [debouncedQuery]);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange?.(newValue);
      setSelectedIndex(-1);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (suggestion: LocationSuggestion) => {
      setInputValue(suggestion.formattedAddress);
      onChange?.(suggestion.formattedAddress);
      onSelect?.(suggestion);
      onCoordinatesChange?.(suggestion.latitude, suggestion.longitude);
      setShowSuggestions(false);
      setSuggestions([]);
    },
    [onChange, onSelect, onCoordinatesChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, handleSelect]
  );

  return (
    <div ref={containerRef} className={cn('relative', containerClassName)}>
      {label && (
        <label
          className={cn(
            'block text-sm/6 font-medium text-gray-900 mb-2',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            'block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6',
            error && 'outline-red-300 focus:outline-red-600'
          )}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Location icon */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => {
            // Format display as: village/city, county, country
            const displayText = suggestion.region 
              ? `${suggestion.city}, ${suggestion.region}, ${suggestion.country}`
              : `${suggestion.city}, ${suggestion.country}`;
            
            return (
              <li
                key={suggestion.placeId || `${suggestion.latitude}-${suggestion.longitude}-${index}`}
                className={cn(
                  'px-4 py-2 cursor-pointer text-sm',
                  index === selectedIndex
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'hover:bg-primary/5 text-gray-900'
                )}
                onClick={() => handleSelect(suggestion)}
              >
                <div className="font-medium">{displayText}</div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Helper text or error */}
      {(error || helperText) && (
        <p
          className={cn(
            'mt-2 text-sm',
            error ? 'text-red-600' : 'text-gray-500'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
