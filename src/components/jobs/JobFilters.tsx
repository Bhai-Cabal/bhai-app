"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JobFiltersProps {
  filters: {
    type: string;
    blockchain: string;
    searchQuery: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function JobFilters({ filters, onFiltersChange }: JobFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery);

  // Sync local search query with filters
  useEffect(() => {
    setLocalSearchQuery(filters.searchQuery);
  }, [filters.searchQuery]);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== filters.searchQuery) {
        onFiltersChange({ ...filters, searchQuery: localSearchQuery.trim() });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchQuery, filters, onFiltersChange]);

  // Constants for filter options
  const blockchains = [
    "Ethereum",
    "Solana",
    "Polygon",
    "Bitcoin",
    "Arbitrum",
    "Optimism"
  ];

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship"
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search jobs, skills, or companies..."
            className="pl-9"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 whitespace-nowrap"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Job Type</label>
            <Select 
              value={filters.type} 
              onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Blockchain</label>
            <Select 
              value={filters.blockchain} 
              onValueChange={(value) => onFiltersChange({ ...filters, blockchain: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                {blockchains.map((chain) => (
                  <SelectItem key={chain} value={chain.toLowerCase()}>
                    {chain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}
    </div>
  );
}