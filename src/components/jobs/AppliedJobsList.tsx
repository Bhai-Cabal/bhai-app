import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase';
import { getUserUuid } from '@/lib/user-helpers';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface AppliedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  salary_range: string;
  applied_date: string;
  application_status: string;
  company_website?: string;
}

export function AppliedJobsList() {
  const { user } = usePrivy();
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetJobs = async () => {
      if (!user?.id) return;

      try {
        const userUuid = await getUserUuid(user.id);
        if (!userUuid) return;

        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            id,
            status,
            created_at,
            jobs (
              id,
              title,
              location,
              job_type,
              salary_range,
              companies (
                name,
                website
              )
            )
          `)
          .eq('user_id', userUuid)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedJobs = data.map(app => ({
          id: app.jobs[0].id,
          title: app.jobs[0].title,
          company: app.jobs[0].companies[0].name,
          company_website: app.jobs[0].companies[0].website,
          location: app.jobs[0].location,
          job_type: app.jobs[0].job_type,
          salary_range: app.jobs[0].salary_range,
          applied_date: new Date(app.created_at).toLocaleDateString(),
          application_status: app.status
        }));

        setAppliedJobs(formattedJobs);
      } catch (error) {
        console.error('Error fetching applied jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetJobs();

    const channel = supabase
      .channel('applied-jobs-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications'
        },
        (payload) => {
          fetchAndSetJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isLoading) {
    return <div className="text-center py-8">Loading your applications...</div>;
  }

  if (appliedJobs.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Applications Found</AlertTitle>
        <AlertDescription>
          You haven't applied to any jobs yet. Browse available jobs and start applying!
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'shortlisted': return 'bg-blue-500';
      case 'reviewed': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {appliedJobs.map((job) => (
        <Card key={job.id} className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <a
                href={job.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:underline"
              >
                {job.company}
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{job.location}</span>
                <span>•</span>
                <span>{job.job_type}</span>
                <span>•</span>
                <span>{job.salary_range}</span>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Badge
                variant="secondary"
                className={`${getStatusColor(job.application_status)} text-white`}
              >
                {job.application_status.charAt(0).toUpperCase() + job.application_status.slice(1)}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Applied on {job.applied_date}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
