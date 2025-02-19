"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Filter, Briefcase, Globe, Bitcoin, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePrivy } from '@privy-io/react-auth';
import { getUserUuid } from '@/lib/user-helpers';
import Link from "next/link";
import { AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { JobDetailsDialog } from "@/components/jobs/JobDetailsDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JobCard } from "@/components/jobs/JobCard";
import { JobPostingForm } from "@/components/jobs/JobPostingForm";
import { JobFilters } from "@/components/jobs/JobFilters";
import { CreatedJobsList } from "@/components/jobs/CreatedJobsList";

interface Job {
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
}

interface Company {
  id: string;
  name: string;
  website: string;
}

interface Skill {
  id: string;
  name: string;
  description?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    blockchain: 'all',
    searchQuery: ''
  });
  const [isPostingJob, setIsPostingJob] = useState(false);
  const { user } = usePrivy();
  const [activeTab, setActiveTab] = useState('browse');

  // Cache companies and skills at the page level
  const [companies, setCompanies] = useState<Company[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add these states at the top of the component
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch static data once
  useEffect(() => {
    const fetchStaticData = async () => {
      if (!isInitialLoad) return;

      try {
        const [companiesResponse, skillsResponse] = await Promise.all([
          supabase.from('companies').select('*').order('name'),
          supabase.from('skills').select('*').order('name')
        ]);

        if (companiesResponse.data) setCompanies(companiesResponse.data);
        if (skillsResponse.data) setSkills(skillsResponse.data);
      } catch (error) {
        console.error('Error fetching static data:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchStaticData();
  }, [isInitialLoad]);

  // Updated jobs fetching logic
  useEffect(() => {
    if (activeTab !== 'browse') return;

    const fetchJobs = async () => {
      setError(null);
      setIsLoading(true);
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
              user_id
            ),
            users (
              id,
              username,
              profile_picture_path
            )
          `)
          .eq('status', 'active');

        // Apply basic filters first
        if (filters.type !== 'all') {
          query = query.eq('job_type', filters.type.toLowerCase());
        }
        if (filters.blockchain !== 'all') {
          query = query.eq('blockchain', filters.blockchain.toLowerCase());
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });
        if (fetchError) throw fetchError;

        let filteredJobs = data || [];

        // Client-side search
        if (filters.searchQuery.trim()) {
          const searchTerm = filters.searchQuery.toLowerCase().trim();
          filteredJobs = filteredJobs.filter(job => {
            const searchableContent = [
              job.title,
              job.description,
              job.companies?.name,
              ...(job.job_skills?.map((js: { skills: Skill }) => js.skills.name) || [])
            ].map(item => (item || '').toLowerCase());
            
            return searchableContent.some(content => content.includes(searchTerm));
          });
        }

        setJobs(filteredJobs.map(formatJobData));
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search
    const handler = setTimeout(fetchJobs, 300);
    return () => clearTimeout(handler);
  }, [filters, activeTab]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Web3 Jobs</h1>
        <Dialog open={isPostingJob} onOpenChange={setIsPostingJob}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Post a Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a New Job Posting</DialogTitle>
            </DialogHeader>
            <JobPostingForm
              onSuccess={() => {
                setFilters(prev => ({ ...prev }));
                setIsPostingJob(false);
              }}
              onClose={() => setIsPostingJob(false)}
              initialCompanies={companies}
              initialSkills={skills}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
          <TabsTrigger value="created">My Job Postings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <JobFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4 animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-6 bg-muted rounded w-16"></div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mt-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : jobs.length === 0 ? (
            <div className="mt-8">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Jobs Found</AlertTitle>
                <AlertDescription>
                  {filters.searchQuery 
                    ? "No jobs match your search criteria. Try adjusting your filters."
                    : "No jobs are currently available. Check back later or be the first to post a job!"}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job}
                  onJobUpdate={() => {
                    setFilters(prev => ({ ...prev }));
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="created">
          <CreatedJobsList onJobUpdate={() => {
            if (activeTab === 'browse') {
              setFilters(prev => ({ ...prev }));
            }
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format job data
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
