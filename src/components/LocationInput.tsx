import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from './ui/select';

interface LocationInputProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
}

interface LocationResult {
  place_id: string;
  display_name: string;
  type: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({ selectedLocation, setSelectedLocation }) => {
  const [query, setQuery] = useState(selectedLocation || '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, [query]);

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
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`);
    const data: LocationResult[] = await response.json();
    const filteredResults = data.filter(result => 
      result.type === 'administrative' || result.type === 'country'
    );
    setResults(filteredResults);
  };

  const handleSelect = (result: LocationResult) => {
    setQuery(result.display_name);
    setSelectedLocation(result.display_name);
    setResults([]);
    setIsInputFocused(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter a location"
        className="w-full p-3 border rounded-lg dark:bg-black dark:border-gray-700 dark:text-white"
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
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