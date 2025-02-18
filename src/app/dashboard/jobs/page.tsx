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
// import { JobPostingForm } from '@/components/jobs/JobPostingForm';

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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBlockchain, setSelectedBlockchain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const { toast } = useToast();
  const [createdJobs, setCreatedJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchJobs();
  }, [selectedType, selectedBlockchain, searchQuery]);

  useEffect(() => {
    // Fetch companies and skills when component mounts
    const fetchData = async () => {
      try {
        // Fetch companies
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*');
        if (companiesData) setCompanies(companiesData);

        // Fetch skills
        const { data: skillsData } = await supabase
          .from('skills')
          .select('*');
        if (skillsData) setSkills(skillsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const fetchJobs = async () => {
    try {
      // Base query with all joins
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

      // Search filter
      if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        query = query.or(
          `title.ilike.${searchTerm},description.ilike.${searchTerm},companies.name.ilike.${searchTerm}`
        );
      }

      // Type filter
      if (selectedType !== 'all') {
        query = query.eq('job_type', selectedType.toLowerCase());
      }

      // Blockchain filter
      if (selectedBlockchain !== 'all') {
        query = query.eq('blockchain', selectedBlockchain.toLowerCase());
      }

      // Apply ordering
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Format the jobs data
      const formattedJobs = data.map(job => ({
        ...job,
        company: job.companies?.name || 'Unknown Company',
        companyWebsite: job.companies?.website,
        skills: job.job_skills?.map((js: any) => js.skills.name).filter(Boolean) || [],
        applicationsCount: job.job_applications?.length || 0,
        applications: job.job_applications || [],
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

  const { user } = usePrivy();
  const router = useRouter();

  useEffect(() => {
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
        setCreatedJobs(data);
      }
    };

    fetchCreatedJobs();
  }, [user]);

  const handleApplicationStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh created jobs to update the UI
      fetchCreatedJobs();

      toast({
        title: (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Application status updated successfully!
            </AlertDescription>
          </Alert>
        )
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to update application status
            </AlertDescription>
          </Alert>
        )
      });
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
            <DialogHeader>
              <DialogTitle>Create a New Job Posting</DialogTitle>
            </DialogHeader>
            <JobPostingForm 
              fetchJobs={fetchJobs}
              onClose={() => {
                const dialogElement = document.querySelector('[role="dialog"]');
                if (dialogElement) {
                  (dialogElement as HTMLElement).click();
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
          <TabsTrigger value="created">My Job Postings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {/* Existing job browsing content */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs, skills, or companies..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {showFilters && (
            <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Job Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {jobTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Blockchain</label>
                <Select value={selectedBlockchain} onValueChange={setSelectedBlockchain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chains</SelectItem>
                    {blockchains.map((chain) => (
                      <SelectItem key={chain} value={chain.toLowerCase()}>
                        {chain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Experience</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="created">
          <div className="space-y-6">
            {createdJobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-muted-foreground">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit Job
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Job Posting</DialogTitle>
                        </DialogHeader>
                        <JobPostingForm 
                          fetchJobs={() => {
                            fetchJobs();
                            fetchCreatedJobs();
                          }}
                          existingJob={{
                            id: job.id,
                            title: job.title,
                            company: job.companies?.name || '',
                            companyId: job.company_id,
                            location: job.location,
                            salary_range: job.salary_range,
                            job_type: job.job_type,
                            blockchain: job.blockchain,
                            description: job.description,
                            experience_level: job.experience_level || '',
                            job_skills: job.job_skills,
                            skills: job.job_skills?.map((js: any) => js.skills.name) || []
                          }}
                          onClose={() => {
                            const dialogElement = document.querySelector('[role="dialog"]');
                            if (dialogElement) {
                              (dialogElement as HTMLElement).click();
                            }
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Badge>{job.status}</Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Applications ({job.job_applications?.length || 0})</h4>
                    <div className="space-y-3">
                      {job.job_applications?.map((application) => (
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const { user, login, ready } = usePrivy();
  const { toast } = useToast();
  const router = useRouter();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        // Check if user is the job creator
        const userUuid = await getUserUuid(user.id);
        setIsCreator(job.user_id === userUuid);

        // Check profile completion
        const { data: profileData } = await supabase
          .from("users")
          .select("profile_completion_percentage")
          .eq("auth_id", user.id)
          .single();

        if (profileData) {
          setProfileCompletion(profileData.profile_completion_percentage);
        }

        // Check application status
        if (!userUuid) {
          setIsCheckingStatus(false);
          return;
        }

        const userApplication = job.applications?.find(app => app.user_id === userUuid);
        setHasApplied(!!userApplication);
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [user, job]);

  const handleApply = async () => {
    try {
      if (!user) {
        login();
        return;
      }

      if (profileCompletion < 100) {
        toast({
          title: (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Profile Incomplete</AlertTitle>
              <AlertDescription>
                Please complete your profile before applying for jobs.
              </AlertDescription>
            </Alert>
          )
        });
        router.push('/dashboard/profile');
        return;
      }

      const userUuid = await getUserUuid(user.id);
      if (!userUuid) {
        toast({
          title: (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>User profile not found</AlertDescription>
            </Alert>
          )
        });
        return;
      }

      if (hasApplied) {
        toast({
          title: (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Already Applied</AlertTitle>
              <AlertDescription>
                You have already applied for this position
              </AlertDescription>
            </Alert>
          )
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

      if (error) throw error;

      setHasApplied(true);
      toast({
        title: (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Application submitted successfully!
            </AlertDescription>
          </Alert>
        )
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to submit application. Please try again.
            </AlertDescription>
          </Alert>
        )
      });
    }
  };

  return (
    <>
      <Card 
        className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="flex items-start justify-between mb-4">
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

        <div className="mt-4 flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground">
            {job.applicationsCount} applications
          </div>
          
          {isCreator ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Job Creator</AlertTitle>
              <AlertDescription>
                You are the creator of this job posting
              </AlertDescription>
            </Alert>
          ) : profileCompletion < 100 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Profile Incomplete</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>Please complete your profile before applying for jobs.</p>
                <Link href="/dashboard/profile">
                  <Button variant="outline" className="mt-2">
                    Complete Profile ({profileCompletion}%)
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          ) : hasApplied ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Application Submitted</AlertTitle>
              <AlertDescription>
                You have already applied for this position
              </AlertDescription>
            </Alert>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleApply}
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
        onEdit={() => router.push(`/dashboard/jobs/edit/${job.id}`)}
      />
    </>
  );
}

function JobPostingForm({ fetchJobs, existingJob, onClose }: { 
  fetchJobs: () => void;
  existingJob?: {
    id: string;
    title: string;
    company: string;
    companyId?: string;
    location: string;
    salary_range: string;
    job_type: string;
    blockchain: string;
    description: string;
    experience_level?: string;
    job_skills?: any[];
    skills?: string[];
  };
  onClose?: () => void;
}) {
  const { user } = usePrivy();
  
  const [formData, setFormData] = useState({
    title: existingJob?.title || '',
    company: existingJob?.company || '',
    location: existingJob?.location || '',
    salary: existingJob?.salary_range || '',
    jobType: existingJob?.job_type || '',
    blockchain: existingJob?.blockchain || '',
    description: existingJob?.description || '',
    experienceLevel: existingJob?.experience_level || '',
    selectedSkills: [] as Skill[]
  });

  // Initialize selected skills from existing job
  useEffect(() => {
    if (existingJob?.job_skills) {
      const skills = existingJob.job_skills.map((js: any) => ({
        id: js.skills.id,
        name: js.skills.name
      }));
      setFormData(prev => ({
        ...prev,
        selectedSkills: skills
      }));
    }
  }, [existingJob]);

  const [formErrors, setFormErrors] = useState({
    title: false,
    company: false,
    location: false,
    salary: false,
    jobType: false,
    blockchain: false,
    description: false
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompanyDetails, setNewCompanyDetails] = useState({
    name: '',
    website: ''
  });
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [isNewSkillDialogOpen, setIsNewSkillDialogOpen] = useState(false);
  const [newSkillDetails, setNewSkillDetails] = useState({
    name: '',
    description: ''
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Fetch companies and skills on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: companiesData } = await supabase.from('companies').select('*');
        if (companiesData) {
          setCompanies(companiesData);
          setFilteredCompanies(companiesData);
        }

        const { data: skillsData } = await supabase.from('skills').select('*');
        if (skillsData) {
          setSkills(skillsData);
          setFilteredSkills(skillsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Handle company search
  const handleCompanySearch = (query: string) => {
    setCompanySearchQuery(query);
    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCompanies(filtered);
  };

  // Handle skill search
  const handleSkillSearch = (query: string) => {
    setSkillInput(query);
    const filtered = skills.filter(skill =>
      skill.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSkills(filtered);
  };

  // Handle new company creation
  const handleAddNewCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([newCompanyDetails])
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [...prev, data]);
      setFilteredCompanies(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, company: data.name }));
      setIsNewCompanyDialogOpen(false);
      setNewCompanyDetails({ name: '', website: '' });
      setAlert({ type: 'success', message: 'Company added successfully' });
    } catch (error) {
      console.error('Error adding company:', error);
      setAlert({ type: 'error', message: 'Failed to add company' });
    }
  };

  // Handle new skill creation
  const handleAddNewSkill = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .insert([newSkillDetails])
        .select()
        .single();

      if (error) throw error;

      setSkills(prev => [...prev, data]);
      setFilteredSkills(prev => [...prev, data]);
      setFormData(prev => ({
        ...prev,
        selectedSkills: [...prev.selectedSkills, data]
      }));
      setIsNewSkillDialogOpen(false);
      setNewSkillDetails({ name: '', description: '' });
      setAlert({ type: 'success', message: 'Skill added successfully' });
    } catch (error) {
      console.error('Error adding skill:', error);
      setAlert({ type: 'error', message: 'Failed to add skill' });
    }
  };

  const handleJobSubmit = async (formData: any) => {
    try {
      if (!user) {
        setAlert({ type: 'error', message: 'Please login to post a job' });
        return;
      }

      const userUuid = await getUserUuid(user.id);
      if (!userUuid) {
        setAlert({ type: 'error', message: 'User profile not found' });
        return;
      }

      // First, get or create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', formData.company)
        .single();

      let companyId = existingJob?.companyId;
      if (!companyId) {
        if (!companyData) {
          const { data: newCompany, error: newCompanyError } = await supabase
            .from('companies')
            .insert({ name: formData.company, website: newCompanyDetails.website })
            .select('id')
            .single();
          
          if (newCompanyError) throw newCompanyError;
          companyId = newCompany.id;
        } else {
          companyId = companyData.id;
        }
      }

      const jobData = {
        title: formData.title,
        company_id: companyId,
        location: formData.location,
        salary_range: formData.salary,
        job_type: formData.jobType,
        blockchain: formData.blockchain,
        description: formData.description,
        experience_level: formData.experienceLevel,
        user_id: userUuid,
        status: 'active'
      };

      let result;
      if (existingJob) {
        // Update existing job
        const { data, error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', existingJob.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;

        // Delete existing job skills
        await supabase
          .from('job_skills')
          .delete()
          .eq('job_id', existingJob.id);
      } else {
        // Create new job
        const { data, error } = await supabase
          .from('jobs')
          .insert(jobData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Handle skills
      const skillPromises = formData.selectedSkills.map(async (skill: Skill) => {
        // Get or create skill
        const { data: existingSkill } = await supabase
          .from('skills')
          .select('id')
          .eq('name', skill.name)
          .single();

        let skillId = skill.id;
        if (!skillId && !existingSkill) {
          const { data: newSkill } = await supabase
            .from('skills')
            .insert({ name: skill.name })
            .select('id')
            .single();
          skillId = newSkill?.id;
        } else if (!skillId) {
          skillId = existingSkill.id;
        }

        // Create job-skill association
        return supabase
          .from('job_skills')
          .insert({ job_id: result.id, skill_id: skillId });
      });

      await Promise.all(skillPromises);
      fetchJobs();
      setAlert({ 
        type: 'success', 
        message: existingJob ? 'Job updated successfully!' : 'Job posted successfully!' 
      });

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating/updating job:', error);
      setAlert({ 
        type: 'error', 
        message: existingJob ? 'Failed to update job' : 'Failed to create job' 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = {
      title: !formData.title,
      company: !formData.company,
      location: !formData.location,
      salary: !formData.salary,
      jobType: !formData.jobType,
      blockchain: !formData.blockchain,
      description: !formData.description
    };
    setFormErrors(errors);

    if (Object.values(errors).some(error => error)) {
      return;
    }

    await handleJobSubmit(formData);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {alert && (
        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Title field */}
      <div>
        <label className="text-sm font-medium mb-2 block">Job Title</label>
        <Input
          placeholder="e.g., Smart Contract Developer"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={formErrors.title ? 'border-red-500' : ''}
        />
        {formErrors.title && <p className="text-red-500 text-sm">Title is required</p>}
      </div>

      {/* Company Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Company</label>
        <Select
          value={formData.company}
          onValueChange={(value) => {
            if (value === 'new') {
              setIsNewCompanyDialogOpen(true);
            } else {
              setFormData(prev => ({ ...prev, company: value }));
            }
          }}
          className={formErrors.company ? 'border-red-500' : ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <Input
                placeholder="Search company"
                value={companySearchQuery}
                onChange={(e) => handleCompanySearch(e.target.value)}
              />
            </div>
            {filteredCompanies.map((company) => (
              <SelectItem key={company.id} value={company.name}>
                {company.name}
              </SelectItem>
            ))}
            <SelectItem value="new">Add New Company</SelectItem>
          </SelectContent>
        </Select>
        {formErrors.company && <p className="text-red-500 text-sm">Company is required</p>}
      </div>

      {/* Skills Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Required Skills</label>
        <div className="space-y-2">
          <Input
            placeholder="Search skills"
            value={skillInput}
            onChange={(e) => handleSkillSearch(e.target.value)}
          />
          {skillInput && (
            <Card className="p-2">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-2 cursor-pointer hover:bg-secondary"
                  onClick={() => {
                    if (!formData.selectedSkills.find(s => s.id === skill.id)) {
                      setFormData(prev => ({
                        ...prev,
                        selectedSkills: [...prev.selectedSkills, skill]
                      }));
                    }
                    setSkillInput('');
                  }}
                >
                  {skill.name}
                </div>
              ))}
              <div
                className="p-2 cursor-pointer hover:bg-secondary"
                onClick={() => setIsNewSkillDialogOpen(true)}
              >
                Add New Skill
              </div>
            </Card>
          )}
          <div className="flex flex-wrap gap-2">
            {formData.selectedSkills.map((skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {skill.name}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      selectedSkills: prev.selectedSkills.filter(s => s.id !== skill.id)
                    }));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Rest of the form fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <Input
            placeholder="e.g., Remote, New York, etc."
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className={formErrors.location ? 'border-red-500' : ''}
          />
          {formErrors.location && <p className="text-red-500 text-sm">Location is required</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Job Type</label>
          <Select
            value={formData.jobType}
            onValueChange={(value) => setFormData({ ...formData, jobType: value })}
            className={formErrors.jobType ? 'border-red-500' : ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
          {formErrors.jobType && <p className="text-red-500 text-sm">Job type is required</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Blockchain</label>
          <Select
            value={formData.blockchain}
            onValueChange={(value) => setFormData({ ...formData, blockchain: value })}
            className={formErrors.blockchain ? 'border-red-500' : ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blockchain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="bitcoin">Bitcoin</SelectItem>
            </SelectContent>
          </Select>
          {formErrors.blockchain && <p className="text-red-500 text-sm">Blockchain is required</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Salary Range</label>
          <Input
            placeholder="e.g., $120k - $180k"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            className={formErrors.salary ? 'border-red-500' : ''}
          />
          {formErrors.salary && <p className="text-red-500 text-sm">Salary range is required</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Job Description</label>
        <Textarea
          placeholder="Describe the role, responsibilities, and requirements..."
          className={`min-h-[200px] ${formErrors.description ? 'border-red-500' : ''}`}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        {formErrors.description && <p className="text-red-500 text-sm">Description is required</p>}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">{existingJob ? 'Update Job' : 'Post Job'}</Button>
      </div>

      {/* New Company Dialog */}
      <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Company Name"
              value={newCompanyDetails.name}
              onChange={(e) => setNewCompanyDetails(prev => ({
                ...prev,
                name: e.target.value
              }))}
            />
            <Input
              placeholder="Company Website"
              value={newCompanyDetails.website}
              onChange={(e) => setNewCompanyDetails(prev => ({
                ...prev,
                website: e.target.value
              }))}
            />
            <Button type="button" onClick={handleAddNewCompany}>
              Add Company
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Skill Dialog */}
      
      <Dialog open={isNewSkillDialogOpen} onOpenChange={setIsNewSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Skill Name"
              value={newSkillDetails.name}
              onChange={(e) => setNewSkillDetails(prev => ({
                ...prev,
                name: e.target.value
              }))}
            />
            <Input
              placeholder="Skill Description (Optional)"
              value={newSkillDetails.description}
              onChange={(e) => setNewSkillDetails(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
            <Button type="button" onClick={handleAddNewSkill}>
              Add Skill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
