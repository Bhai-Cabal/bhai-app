"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, ArrowRight, LogIn } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobCard } from "@/components/jobs/JobCard";
import { Job, Company } from '@/types/job'; // Import the Job type from types

// Remove local Job interface and use the imported one

interface JobResponse {
  id: string;
  title: string;
  description: string;
  salary_range: string;
  job_type: string;
  location: string;
  blockchain: string;
  created_at: string;
  status: string;
  experience_level: string;
  companies: {
    id: string; // Add id field to match Company type
    name: string;
    website: string;
  };
  job_skills: {
    skills: {
      name: string;
    };
  }[];
  job_applications?: any[];
}

const JobListings = () => {
  const { user } = usePrivy();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [filters, setFilters] = useState({
    type: 'all',
    blockchain: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    if (user) {
      router.push("/dashboard/jobs");
      return;
    }

    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('jobs')
          .select(`
            *,
            companies (
              name,
              website
            ),
            job_skills (
              skills (
                name
              )
            ),
            job_applications (
              id
            )
          `)
          .eq('status', 'active');

        // Apply filters
        if (filters.type !== 'all') {
          query = query.eq('job_type', filters.type.toLowerCase());
        }
        if (filters.blockchain !== 'all') {
          query = query.eq('blockchain', filters.blockchain.toLowerCase());
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });
        if (fetchError) throw fetchError;

        let filteredJobs = data || [];

        // Client-side search with proper typing
        if (filters.searchQuery.trim()) {
          const searchTerm = filters.searchQuery.toLowerCase().trim();
          filteredJobs = filteredJobs.filter((job: JobResponse) => {
            const searchableContent = [
              job.title,
              job.description,
              job.companies?.name,
              ...(job.job_skills?.map((js: { skills: { name: string } }) => js.skills.name) || [])
            ].map(item => (item || '').toLowerCase());
            
            return searchableContent.some(content => content.includes(searchTerm));
          });
        }

        setJobs(filteredJobs.map((job: JobResponse) => formatJobData(job)));
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search
    const handler = setTimeout(fetchJobs, 300);
    return () => clearTimeout(handler);
  }, [user, router, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <div className="relative bg-background/95 py-20 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
              Web3 Job Opportunities
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Discover innovative opportunities in blockchain, DeFi, and Web3. 
              Join the future of technology and be part of the decentralized revolution.
            </p>
            {!user && (
              <div className="flex items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Sign in to Apply <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Non-logged in user banner */}
      {!user && (
        <div className="sticky top-0 z-50 bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Sign in to apply for jobs and access more features
              </p>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <JobFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 border border-primary/10 shadow-sm">
                  <div className="space-y-4 animate-pulse">
                    <div className="h-6 bg-primary/5 rounded w-3/4"></div>
                    <div className="h-4 bg-primary/5 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-primary/5 rounded w-full"></div>
                      <div className="h-4 bg-primary/5 rounded w-full"></div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-6 bg-primary/5 rounded w-16"></div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Alert className="bg-primary/5 border-primary/10">
                <Info className="h-4 w-4" />
                <AlertTitle>No Jobs Found</AlertTitle>
                <AlertDescription>
                  {filters.searchQuery 
                    ? "No jobs match your search criteria. Try adjusting your filters."
                    : "No jobs are currently available. Check back later!"}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  publicView={true}
                  onJobUpdate={() => setFilters(prev => ({ ...prev }))}
                  profileCompletion={100} // Assuming a default value of 100 for profileCompletion
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      {!user && jobs.length > 0 && (
        <div className="bg-primary/5 border-t py-12 mt-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Web3 Journey?</h2>
            <p className="text-muted-foreground mb-6">
              Create an account to apply for jobs and get personalized recommendations
            </p>
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Update the formatJobData function with proper typing
const formatJobData = (job: JobResponse): Job => ({
  id: job.id,
  title: job.title,
  description: job.description,
  salary_range: job.salary_range,
  job_type: job.job_type,
  location: job.location,
  blockchain: job.blockchain,
  created_at: job.created_at,
  status: job.status || 'active',
  company: job.companies?.name || 'Unknown Company',
  companyWebsite: job.companies?.website,
  companies: job.companies, // Include the full companies object
  skills: job.job_skills?.map(js => js.skills.name).filter(Boolean) || [],
  applicationsCount: job.job_applications?.length || 0,
  applications: job.job_applications || [],
  posted: new Date(job.created_at).toLocaleDateString(),
  experience_level: job.experience_level || 'Not specified'
});

export default JobListings;
