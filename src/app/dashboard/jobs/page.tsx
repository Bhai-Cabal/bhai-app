"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JobCard } from "@/components/jobs/job-card";
import { JobSearch } from "@/components/jobs/job-search";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobPostingForm } from "@/components/jobs/job-posting-form";
import type { Job } from "@/types/jobs";

export default function JobsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBlockchain, setSelectedBlockchain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);

  const blockchains = [
    "Ethereum",
    "Solana",
    "Polygon",
    "Bitcoin",
    "Arbitrum",
    "Optimism"
  ];

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship"
  ];

  useEffect(() => {
    fetchJobs();
  }, [selectedType, selectedBlockchain, searchQuery]);

  const fetchJobs = async () => {
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
          job_skills!inner (
            skills (
              id,
              name
            )
          ),
          job_applications (
            id,
            status
          ),
          users (
            username,
            profile_picture_path
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedType !== 'all') {
        query = query.eq('job_type', selectedType);
      }

      if (selectedBlockchain !== 'all') {
        query = query.eq('blockchain', selectedBlockchain);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,companies.name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedJobs = data.map(job => ({
        ...job,
        company: job.companies?.name || 'Unknown Company',
        companyWebsite: job.companies?.website,
        skills: job.job_skills?.map((js: any) => js.skills.name) || [],
        applicationsCount: job.job_applications?.length || 0,
        postedBy: job.users?.username || 'Anonymous',
        postedByAvatar: job.users?.profile_picture_path,
        posted: new Date(job.created_at).toLocaleDateString()
      }));

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Web3 Jobs</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Post a Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
              <DialogTitle>Create a New Job Posting</DialogTitle>
            </DialogHeader>
            <JobPostingForm fetchJobs={fetchJobs} />
          </DialogContent>
        </Dialog>
      </div>

      <JobSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {showFilters && (
        <JobFilters
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedBlockchain={selectedBlockchain}
          setSelectedBlockchain={setSelectedBlockchain}
          jobTypes={jobTypes}
          blockchains={blockchains}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
