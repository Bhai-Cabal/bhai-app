import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Job } from "@/types/job";
import { Globe, Briefcase, Bitcoin, DollarSign, BarChart2 } from "lucide-react";

interface JobDetailsDialogProps {
  job: Job;
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
  onEdit
}: JobDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl mb-2">{job.title}</DialogTitle>
              <div className="flex items-center gap-3">
                <a 
                  href={job.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-muted-foreground hover:text-primary hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  {job.company}
                </a>
                <Badge variant="outline">{job.posted}</Badge>
              </div>
            </div>
            {/* {isCreator && onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Edit Job
              </Button>
            )} */}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {job.location}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Job Type</div>
              <div className="font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {job.job_type}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Blockchain</div>
              <div className="font-medium flex items-center gap-2">
                <Bitcoin className="h-4 w-4" />
                {job.blockchain}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Salary Range</div>
              <div className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {job.salary_range}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Experience Level</div>
              <div className="font-medium flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                {job.experience_level}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-lg font-medium mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium mb-3">Job Description</h3>
            <div className="prose prose-sm max-w-none">
              {job.description.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="mb-4 text-muted-foreground">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!isCreator && (
              <Button onClick={onApply}>Apply Now</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
