import { useState } from 'react';
import { Job } from '@/types/job';
import { JobDetailsDialog } from './JobDetailsDialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Briefcase, Bitcoin, BarChart2 } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onJobUpdate?: () => void;
  isCreator?: boolean;
  hasApplied?: boolean;
  profileCompletion: number;
}

export function JobCard({ 
  job, 
  onJobUpdate, 
  isCreator = false, 
  hasApplied = false,
  profileCompletion 
}: JobCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <Card 
        className={`p-6 hover:shadow-lg transition-shadow cursor-pointer relative ${
          job.status === 'closed' ? 'opacity-75' : ''
        }`}
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
            <a 
              href={job.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {job.company}
            </a>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary">{job.posted}</Badge>
            {hasApplied && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Applied
              </Badge>
            )}
            {job.status === 'closed' && (
              <Badge variant="destructive">Closed</Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            {job.location}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            {job.job_type}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bitcoin className="h-4 w-4" />
            {job.blockchain}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart2 className="h-4 w-4" />
            {job.experience_level}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      </Card>

      <JobDetailsDialog
        job={job}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        isCreator={isCreator}
        hasApplied={hasApplied}
        profileCompletion={profileCompletion}
        onJobUpdate={onJobUpdate}
      />
    </>
  );
}