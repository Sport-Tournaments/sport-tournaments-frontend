'use client';

import { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import { cn } from '@/utils/helpers';
import { useDebounce } from '@/hooks';
import { searchLocations } from '@/services/location.service';

export interface CountryAutocompleteProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  containerClassName?: string;
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const CountryAutocomplete = forwardRef<HTMLInputElement, CountryAutocompleteProps>(
  (
    {
      label,
      error,
      helperText,
      placeholder = 'Start typing a country...',
      required,
      containerClassName,
      value = '',
      name,
      onChange,
      onBlur,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const internalInputRef = useRef<HTMLInputElement>(null);

    // Use the forwarded ref or internal ref
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalInputRef;

    const debouncedQuery = useDebounce(inputValue, 300);

    // Fetch suggestions when query changes
    useEffect(() => {
      async function fetchCountrySuggestions() {
        if (!debouncedQuery || debouncedQuery.length < 3) {
          setSuggestions([]);
          return;
        }

        setIsLoading(true);
        try {
          const response = await searchLocations(debouncedQuery, 10);
          if (response.success && response.data) {
            // Extract unique countries from results
            const countries = response.data
              .map((loc) => loc.country)
              .filter((country): country is string => !!country);
            
            // Get unique countries and filter by query
            const uniqueCountries = [...new Set(countries)]
              .filter((country) =>
                country.toLowerCase().includes(debouncedQuery.toLowerCase())
              )
              .slice(0, 5);

            setSuggestions(uniqueCountries);
            setShowSuggestions(uniqueCountries.length > 0);
          }
        } catch (error) {
          console.error('Error fetching country suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }

      fetchCountrySuggestions();
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
        onChange?.(e);
        setSelectedIndex(-1);
      },
      [onChange]
    );

    const handleSelect = useCallback(
      (country: string) => {
        setInputValue(country);
        // Create a synthetic event for react-hook-form compatibility
        if (inputRef.current) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          nativeInputValueSetter?.call(inputRef.current, country);
          const event = new Event('input', { bubbles: true });
          inputRef.current.dispatchEvent(event);
        }
        setShowSuggestions(false);
        setSuggestions([]);
      },
      [inputRef]
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

    const inputId = name || 'country';

    return (
      <div ref={containerRef} className={cn('relative', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
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
            id={inputId}
            name={name}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={onBlur}
            placeholder={placeholder}
            autoComplete="off"
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

          {/* Globe icon */}
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
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((country, index) => (
              <li
                key={country}
                className={cn(
                  'px-4 py-2 cursor-pointer text-sm',
                  index === selectedIndex
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'hover:bg-primary/5 text-gray-900'
                )}
                onClick={() => handleSelect(country)}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{country}</span>
                </div>
              </li>
            ))}
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
);

CountryAutocomplete.displayName = 'CountryAutocomplete';

export default CountryAutocomplete;
