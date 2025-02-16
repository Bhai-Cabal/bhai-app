"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, Globe, Timer, DollarSign, Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";

interface Job {
  id: string;
  title: string;
  description: string;
  salary_range: string;
  job_type: string;
  location: string;
  blockchain: string;
  created_at: string;
  companies: {
    name: string;
    website: string;
  };
  job_skills: {
    skills: {
      name: string;
    };
  }[];
}

const JobListings = () => {
  const { user } = usePrivy();
  const [jobs, setJobs] = useState<Job[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard/jobs");
      return;
    }

    const fetchJobs = async () => {
      const { data, error } = await supabase
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
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data);
      }
    };

    fetchJobs();
  }, [user, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Web3 Job Opportunities</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join the future of technology. Sign in to apply for these positions and start your Web3 journey.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {jobs.map((job) => (
          <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                  <Link 
                    href={job.companies.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    {job.companies.name}
                  </Link>
                </div>
                <Badge variant="secondary">
                  {formatDate(job.created_at)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{job.job_type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{job.salary_range}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{job.blockchain}</span>
                </div>
              </div>

              <div>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                  {job.description}
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  {job.job_skills.map((js, index) => (
                    <Badge key={index} variant="outline">
                      {js.skills.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Sign in to see more details and apply
                </p>
                <Link href="/login">
                  <Button>
                    Sign In to Apply
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobListings;
