import { Search, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JobSearchProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
}

export function JobSearch({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
}: JobSearchProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, skills, or companies..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4" />
        Filters
        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  );
}
