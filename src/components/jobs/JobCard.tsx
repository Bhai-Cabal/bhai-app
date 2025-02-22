import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { getUserUuid } from '@/lib/user-helpers';
import { JobDetailsDialog } from './JobDetailsDialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Globe, Briefcase, Bitcoin, Info, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onJobUpdate?: () => void;
  publicView?: boolean; // Add the publicView property
}

export function JobCard({ job, onJobUpdate }: JobCardProps) {
  const { user, login } = usePrivy();
  const { toast } = useToast();
  const router = useRouter();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isCreator, setIsCreator] = useState(false);
  const [isProfileCheckLoading, setIsProfileCheckLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setIsProfileCheckLoading(false);
        return;
      }

      try {
        const userUuid = await getUserUuid(user.id);
        setIsCreator(job.user_id === userUuid);

        const { data: profileData } = await supabase
          .from("users")
          .select("profile_completion_percentage")
          .eq("auth_id", user.id)
          .single();

        if (profileData) {
          setProfileCompletion(profileData.profile_completion_percentage || 0);
        }

        if (!userUuid) {
          setIsCheckingStatus(false);
          return;
        }

        const userApplication = job.applications?.find(app => app.user_id === userUuid);
        setHasApplied(!!userApplication);
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setIsProfileCheckLoading(false);
        setIsCheckingStatus(false);
      }
    };

    checkUserStatus();
  }, [user, job]);

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

    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) throw new Error("User profile not found");

      if (hasApplied) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this position"
        });
        return;
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          user_id: userUuid,
          status: 'pending'
        });

      if (error) throw error;

      setHasApplied(true);
      toast({
        title: "Success",
        description: "Application submitted successfully!"
      });
      
      if (onJobUpdate) onJobUpdate();
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card 
        className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
        onClick={() => setIsDetailsOpen(true)}
      >
        {isProfileCheckLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

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
          <Badge variant="secondary">{job.posted}</Badge>
        </div>

        {/* Job details */}
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

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Application section with improved UI */}
        <div className="mt-4 flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {job.applicationsCount} application{job.applicationsCount !== 1 ? 's' : ''}
          </div>
          
          {isCreator ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Your Job Posting</AlertTitle>
              <AlertDescription>
                You can manage applications from the "My Job Postings" tab
              </AlertDescription>
            </Alert>
          ) : !user ? (
            <Button 
              className="w-full" 
              onClick={(e) => {
                e.stopPropagation();
                login();
              }}
            >
              Apply
            </Button>
          ) : profileCompletion < 100 ? (
            <div className="space-y-4">
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive">Profile Incomplete ({profileCompletion}%)</AlertTitle>
                <AlertDescription className="text-destructive/90">
                  Complete your profile to unlock job applications
                </AlertDescription>
              </Alert>
              <Link 
                href="/dashboard/profile" 
                onClick={(e) => e.stopPropagation()}
                className="block w-full"
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                >
                  Complete Profile
                </Button>
              </Link>
            </div>
          ) : hasApplied ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Application Submitted</AlertTitle>
              <AlertDescription>
                You have already applied for this position
              </AlertDescription>
            </Alert>
          ) : (
            <Button 
              className="w-full" 
              onClick={(e) => {
                e.stopPropagation();
                handleApply();
              }}
              disabled={isCheckingStatus}
            >
              {isCheckingStatus ? 'Checking...' : 'Apply Now'}
            </Button>
          )}
        </div>
      </Card>

      <JobDetailsDialog
        job={job}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        isCreator={isCreator}
        onApply={handleApply}
        onEdit={() => {}}
      />
    </>
  );
}