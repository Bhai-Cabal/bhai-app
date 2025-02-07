import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';

export const LocationInput = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setResults([]);
        setQuery(''); // Clear the input if nothing is selected
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`);
    const data = await response.json();
    const filteredResults = data.filter(result => 
      result.type === 'administrative' || result.type === 'country'
    );
    setResults(filteredResults);
  };

  const handleSelect = (result) => {
    setQuery(result.display_name);
    setResults([]);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter a location"
        className="w-full p-3 border rounded-lg"
      />
      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg">
          {results.map((result) => (
            <li
              key={result.place_id}
              className="p-3 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(result)}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};