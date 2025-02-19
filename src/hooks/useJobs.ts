import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePrivy } from '@privy-io/react-auth';
import { getUserUuid } from '@/lib/user-helpers';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  job_type: string;
  blockchain: string;
  description: string;
  skills: string[];
  created_at: string;
  status: string;
  applications?: any[];
  company_id?: string;
  user_id?: string;
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createdJobs, setCreatedJobs] = useState<Job[]>([]);
  const { user } = usePrivy();

  const fetchJobs = async (filters?: {
    searchQuery?: string;
    selectedType?: string;
    selectedBlockchain?: string;
  }) => {
    try {
      let query = supabase
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
          ),
          users (
            id,
            username,
            profile_picture_path
          )
        `)
        .eq('status', 'active');

      if (filters?.searchQuery) {
        const searchTerm = `%${filters.searchQuery}%`;
        query = query.or(
          `title.ilike.${searchTerm},description.ilike.${searchTerm},companies.name.ilike.${searchTerm}`
        );
      }

      if (filters) {
        query = query.eq('job_type', filters.selectedType?.toLowerCase());
      }

      if (filters) {
        query = query.eq('blockchain', filters.selectedBlockchain?.toLowerCase());
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const formattedJobs = data.map(formatJobData);
      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreatedJobs = async () => {
    if (!user?.id) return;
    
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

    if (!error && data) {
      setCreatedJobs(data.map(formatJobData));
    }
  };

  const formatJobData = (job: any): Job => ({
    ...job,
    company: job.companies?.name || 'Unknown Company',
    companyWebsite: job.companies?.website,
    skills: job.job_skills?.map((js: any) => js.skills.name).filter(Boolean) || [],
    applicationsCount: job.job_applications?.length || 0,
    applications: job.job_applications || [],
    postedBy: job.users?.username || 'Anonymous',
    postedByAvatar: job.users?.profile_picture_path,
    posted: new Date(job.created_at).toLocaleDateString()
  });

  useEffect(() => {
    if (user?.id) {
      fetchCreatedJobs();
    }
  }, [user]);

  return {
    jobs,
    createdJobs,
    isLoading,
    fetchJobs,
    fetchCreatedJobs
  };
}
