import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Globe, Bitcoin, Calendar, Building2 } from "lucide-react";

interface JobDetailsDialogProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  onApply: () => void;
  onEdit?: () => void;
}

export function JobDetailsDialog({
  job,
  isOpen,
  onClose,
  isCreator,
  onApply,
}: JobDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{job.title}</DialogTitle>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <a 
              href={job.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {job.company}
            </a>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{job.job_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{job.blockchain}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{job.posted}</span>
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill: string) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Job Description</h3>
            <div className="prose max-w-none text-muted-foreground">
              {job.description}
            </div>
          </div>

          {/* Action Button - only show Apply button for non-creators */}
          {!isCreator && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onApply}>
                Apply Now
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
