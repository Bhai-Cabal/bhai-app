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
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserUuid } from '@/lib/user-helpers';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle, AlertCircle } from "lucide-react";

interface JobDetailsDialogProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  hasApplied: boolean;
  profileCompletion: number;
  onJobUpdate?: () => void;
}

export function JobDetailsDialog({
  job,
  isOpen,
  onClose,
  isCreator,
  hasApplied,
  profileCompletion,
  onJobUpdate
}: JobDetailsDialogProps) {
  const { user, login } = usePrivy();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApply = async () => {
    if (!user) {
      login();
      return;
    }

    if (profileCompletion < 100) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before applying for jobs.",
        variant: "destructive"
      });
      router.push('/dashboard/profile');
      return;
    }

    setIsSubmitting(true);

    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) throw new Error("User profile not found");

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          user_id: userUuid,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application submitted successfully!"
      });
      
      if (onJobUpdate) onJobUpdate();
      onClose();
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Application Section */}
          <div className="pt-4 border-t">
            {isCreator ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Your Job Posting</AlertTitle>
                <AlertDescription>
                  You can manage applications from the "My Job Postings" tab
                </AlertDescription>
              </Alert>
            ) : job.status === 'closed' ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Applications Closed</AlertTitle>
                <AlertDescription>
                  This position is no longer accepting new applications
                </AlertDescription>
              </Alert>
            ) : hasApplied ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Application Submitted</AlertTitle>
                <AlertDescription>
                  You have already applied for this position. Check the "Applied Jobs" tab for status updates.
                </AlertDescription>
              </Alert>
            ) : !user ? (
              <Button className="w-full" onClick={login}>
                Login to Apply
              </Button>
            ) : profileCompletion < 100 ? (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Profile Incomplete ({profileCompletion}%)</AlertTitle>
                  <AlertDescription>
                    Complete your profile to apply for this position
                  </AlertDescription>
                </Alert>
                <Link href="/dashboard/profile">
                  <Button variant="outline" className="w-full">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleApply} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Apply Now'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
