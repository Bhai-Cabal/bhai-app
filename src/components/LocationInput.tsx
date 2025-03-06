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
  uniqueId?: string; // Add this new property
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

  const formatLocationName = (props: LocationResult['properties']): string => {
    const parts = [];
    const city = props.city?.trim();
    const state = props.state?.trim();
    const country = props.country?.trim();

    // Add parts only if they're unique
    if (city) parts.push(city);
    if (state && state !== city) parts.push(state);
    if (country && country !== state) parts.push(country);
    
    return parts.join(', ');
  };

  const handleSearch = useCallback(async () => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    try {
      const response = await fetch(
        `${PHOTON_API_URL}?q=${encodeURIComponent(query)}&limit=15`
      );
      
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const seenNames = new Set<string>();
      const processedResults: LocationResult[] = [];
      
      data.features
        .filter((feature: LocationResult) => {
          const props = feature.properties;
          return props.city || props.state || props.country;
        })
        .forEach((feature: LocationResult) => {
          const displayName = formatLocationName(feature.properties);
          const coords = feature.geometry.coordinates;
          
          // Skip empty or duplicate names
          if (!displayName || seenNames.has(displayName.toLowerCase())) {
            return;
          }

          // Prioritize exact matches and shorter names
          const isExactMatch = displayName.toLowerCase().includes(query.toLowerCase());
          const priority = isExactMatch ? 0 : displayName.length;

          processedResults.push({
            place_id: `location-${Date.now()}-${Math.random()}`,
            uniqueId: `${displayName}-${coords[0]}-${coords[1]}`,
            display_name: displayName,
            type: getLocationType(feature.properties),
            lat: coords[1].toString(),
            lon: coords[0].toString(),
            properties: feature.properties,
            geometry: feature.geometry
          });

          seenNames.add(displayName.toLowerCase());
        });

      // Sort results by priority and limit to 5 items
      setResults(
        processedResults
          .sort((a, b) => {
            const aExact = a.display_name.toLowerCase().includes(query.toLowerCase());
            const bExact = b.display_name.toLowerCase().includes(query.toLowerCase());
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return a.display_name.length - b.display_name.length;
          })
          .slice(0, 5)
      );
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

  const getLocationType = (props: LocationResult['properties']): string => {
    if (props.city) return 'city';
    if (props.state) return 'state';
    if (props.country) return 'country';
    return props.osm_value || 'place';
  };

  const handleSelect = (result: LocationResult) => {
    try {
      const locationData = {
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
      setDisplayValue(result.display_name);
      setSelectedLocation(JSON.stringify(locationData));
      setResults([]);
      setIsInputFocused(false);
      setQuery(result.display_name);
    } catch (error) {
      console.error('Error selecting location:', error);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => {
          const value = e.target.value;
          setDisplayValue(value);
          setQuery(value);
          if (!value) {
            setResults([]);
          }
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
              key={result.uniqueId || result.place_id} // Use uniqueId as primary key
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