import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

interface LocationInputProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  error?: string;
}

interface LocationResult {
  place_id: string;
  properties: {
    name: string;
    country: string;
    state?: string;
    city?: string;
    osm_value: string;
    osm_type: string;
  };
  geometry: {
    coordinates: [number, number];
  };
  display_name: string;
  type: string;
  lat: string;
  lon: string;
}

const DEBOUNCE_DELAY = 300;
const PHOTON_API_URL = 'https://photon.komoot.io/api/';

export const LocationInput: React.FC<LocationInputProps> = ({
  selectedLocation,
  setSelectedLocation,
  error
}) => {
  const [query, setQuery] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setQuery(selectedLocation || '');
  }, [selectedLocation]);

  useEffect(() => {
    setDisplayValue(selectedLocation || '');
  }, [selectedLocation]);

  const handleSearch = useCallback(async () => {
    if (query.length < 2) return;
    
    try {
      const response = await fetch(
        `${PHOTON_API_URL}?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      const filteredResults = data.features
        .filter((feature: LocationResult) => {
          const props = feature.properties;
          return props.city || props.state || props.country;
        })
        .map((feature: LocationResult) => ({
          place_id: `${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}`,
          display_name: formatLocationName(feature.properties),
          type: getLocationType(feature.properties),
          lat: feature.geometry.coordinates[1].toString(),
          lon: feature.geometry.coordinates[0].toString()
        }));

      setResults(filteredResults);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (query && query !== selectedLocation) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        handleSearch();
      }, DEBOUNCE_DELAY);
    }
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, selectedLocation, handleSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatLocationName = (props: LocationResult['properties']): string => {
    const parts = [];
    if (props.city) parts.push(props.city);
    if (props.state) parts.push(props.state);
    if (props.country) parts.push(props.country);
    return parts.join(', ');
  };

  const getLocationType = (props: LocationResult['properties']): string => {
    if (props.city) return 'city';
    if (props.state) return 'state';
    if (props.country) return 'country';
    return props.osm_value || 'place';
  };

  const handleSelect = (result: LocationResult) => {
    const locationData = {
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    setDisplayValue(result.display_name);
    setSelectedLocation(JSON.stringify(locationData));
    setResults([]);
    setIsInputFocused(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setDisplayValue(e.target.value);
          setQuery(e.target.value);
        }}
        placeholder="Enter a location"
        className={cn(
          "w-full p-3 border rounded-lg dark:bg-black dark:border-gray-700 dark:text-white",
          error && "border-red-500",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        )}
        onFocus={() => setIsInputFocused(true)}
      />
      {isInputFocused && results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg dark:bg-black dark:border-gray-700 max-h-60 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.place_id}
              className="p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white flex flex-col"
              onClick={() => handleSelect(result)}
            >
              <span className="font-medium">{result.display_name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
      {isInputFocused && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 p-3 dark:bg-black dark:border-gray-700 text-gray-500">
          No locations found
        </div>
      )}
    </div>
  );
};