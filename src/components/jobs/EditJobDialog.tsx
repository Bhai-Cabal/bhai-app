import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobPostingForm } from "./JobPostingForm";

interface EditJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onJobUpdated: () => void;
}

export function EditJobDialog({ isOpen, onClose, job, onJobUpdated }: EditJobDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="top-0 z-10 pb-4 border-b">
          <DialogTitle>Edit Job Posting</DialogTitle>
        </DialogHeader>
        <JobPostingForm 
          fetchJobs={onJobUpdated} 
          initialData={job}
          isEditing={true}
          onComplete={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
