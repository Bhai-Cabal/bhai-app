import { usePrivy } from '@privy-io/react-auth';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Globe, Bitcoin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getUserUuid } from '@/lib/user-helpers';
import { Job } from '@/types/jobs';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';

export function JobCard({ job }: { job: Job }) {
  const { user, login, ready } = usePrivy();
  const { toast } = useToast();
  const [hasApplied, setHasApplied] = useState(false);

  // Check if user has already applied when component mounts or user changes
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user) return;

      const userUuid = await getUserUuid(user.id);
      if (!userUuid) return;

      const { data, error } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('user_id', userUuid)
        .single();

      if (data) {
        setHasApplied(true);
      }
    };

    checkApplicationStatus();
  }, [user, job.id]);

  const handleApply = async () => {
    try {
      if (!user) {
        login();
        return;
      }

      const userUuid = await getUserUuid(user.id);
      if (!userUuid) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User profile not found"
        });
        return;
      }

      // Check if already applied
      if (hasApplied) {
        toast({
          variant: "destructive",
          title: "Already Applied",
          description: "You have already applied for this job"
        });
        return;
      }

      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          user_id: userUuid,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      } else {
        setHasApplied(true);
        toast({
          title: "Success",
          description: "Application submitted successfully!"
        });
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit application"
      });
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* ...existing card layout... */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {job.postedByAvatar && (
            <img
              src={job.postedByAvatar}
              alt={job.postedBy}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
            <a 
              href={job.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:underline"
            >
              {job.company}
            </a>
          </div>
        </div>
        <Badge variant="secondary">{job.posted}</Badge>
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
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {job.applicationsCount} applications
        </div>
        <Button 
          className="w-auto" 
          onClick={handleApply}
          variant={hasApplied ? "secondary" : "default"}
          disabled={hasApplied}
        >
          {hasApplied ? 'Applied' : 'Apply Now'}
        </Button>
      </div>
    </Card>
  );
}
