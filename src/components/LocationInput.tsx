import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

interface LocationInputProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  error?: string;
}

interface LocationResult {
  place_id: string;
  display_name: string;
  type: string;
  lat: string;
  lon: string;
}

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

  useEffect(() => {
    setQuery(selectedLocation || '');
  }, [selectedLocation]);

  useEffect(() => {
    setDisplayValue(selectedLocation || '');
  }, [selectedLocation]);

  useEffect(() => {
    if (query && query !== selectedLocation) {
      handleSearch();
    }
  }, [query, selectedLocation]);

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

  const handleSearch = async () => {
    if (query.length < 2) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
      );
      const data: LocationResult[] = await response.json();
      const filteredResults = data.filter(result => 
        result.type === 'administrative' || result.type === 'country'
      );
      setResults(filteredResults);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setResults([]);
    }
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
          error && "border-red-500"
        )}
        onFocus={() => setIsInputFocused(true)}
      />
      {isInputFocused && results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg dark:bg-black dark:border-gray-700">
          {results.map((result) => (
            <div
              key={result.place_id}
              className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
              onClick={() => handleSelect(result)}
            >
              {result.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};