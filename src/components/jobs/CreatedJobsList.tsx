import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase';
import { getUserUuid } from '@/lib/user-helpers';
import { Job } from '@/types/job';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JobPostingForm } from './JobPostingForm';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface CreatedJobsListProps {
  onJobUpdate?: () => void;
}

export function CreatedJobsList({ onJobUpdate }: CreatedJobsListProps) {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [createdJobs, setCreatedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const fetchCreatedJobs = async () => {
    if (!user?.id) return;
    
    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) return;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            website
          ),
          job_skills (
            skills (
              id,
              name
            )
          ),
          job_applications (
            id,
            status,
            user_id,
            users (
              id,
              full_name,
              profile_picture_path,
              email
            )
          )
        `)
        .eq('user_id', userUuid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreatedJobs(data || []);
    } catch (error) {
      console.error('Error fetching created jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatedJobs();
  }, [user]);

  const handleApplicationStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh jobs list
      fetchCreatedJobs();
      if (onJobUpdate) onJobUpdate();

      toast({
        title: "Success",
        description: `Application ${newStatus} successfully`,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      // First delete job_skills (due to foreign key constraint)
      await supabase
        .from('job_skills')
        .delete()
        .eq('job_id', jobId);

      // Then delete job_applications
      await supabase
        .from('job_applications')
        .delete()
        .eq('job_id', jobId);

      // Finally delete the job
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Update local state
      setCreatedJobs(prev => prev.filter(job => job.id !== jobId));
      
      if (onJobUpdate) onJobUpdate();

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your job postings...</div>;
  }

  if (createdJobs.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Jobs Found</AlertTitle>
        <AlertDescription>
          You haven't posted any jobs yet. Click the "Post a Job" button to create your first job posting.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {createdJobs.map((job) => (
        <Card key={job.id} className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <p className="text-muted-foreground">{job.company}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingJob(job)}
              >
                Edit Job
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the job posting
                      and remove all associated applications.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteJob(job.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Badge>{job.status}</Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Applications ({job.applications?.length || 0})</h4>
              <div className="space-y-3">
                {job.applications?.map((application) => (
                  <Card key={application.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={application.users?.profile_picture_path} />
                          <AvatarFallback>{application.users?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{application.users?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{application.users?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {application.status === 'pending' ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleApplicationStatus(application.id, 'rejected')}
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleApplicationStatus(application.id, 'accepted')}
                            >
                              Accept
                            </Button>
                          </>
                        ) : (
                          <Badge variant={application.status === 'accepted' ? 'default' : 'destructive'}>
                            {application.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Edit Job Dialog */}
      <Dialog 
        open={!!editingJob} 
        onOpenChange={(open) => !open && setEditingJob(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <JobPostingForm
              existingJob={editingJob}
              onSuccess={() => {
                fetchCreatedJobs();
                if (onJobUpdate) onJobUpdate();
                setEditingJob(null);
              }}
              onClose={() => setEditingJob(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 