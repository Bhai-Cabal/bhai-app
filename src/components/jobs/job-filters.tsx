import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobFiltersProps {
  selectedType: string;
  setSelectedType: (value: string) => void;
  selectedBlockchain: string;
  setSelectedBlockchain: (value: string) => void;
  jobTypes: string[];
  blockchains: string[];
}

export function JobFilters({
  selectedType,
  setSelectedType,
  selectedBlockchain,
  setSelectedBlockchain,
  jobTypes,
  blockchains,
}: JobFiltersProps) {
  return (
    <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Job Type</label>
        <Select value={selectedType} onValueChange={setSelectedType}>
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
        <Select value={selectedBlockchain} onValueChange={setSelectedBlockchain}>
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
      <div>
        <label className="text-sm font-medium mb-2 block">Experience</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entry">Entry Level</SelectItem>
            <SelectItem value="mid">Mid Level</SelectItem>
            <SelectItem value="senior">Senior Level</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
