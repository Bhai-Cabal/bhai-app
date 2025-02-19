import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase';
import { getUserUuid } from '@/lib/user-helpers';
import { Job, Skill, Company } from '@/types/job';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobPostingFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  existingJob?: Partial<Job>;
  initialCompanies?: Company[];
  initialSkills?: Skill[];
}

interface FormData {
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  blockchain: string;
  description: string;
  experienceLevel: string;
  selectedSkills: Skill[];
}

interface FormErrors {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  blockchain?: string;
  description?: string;
  skills?: string;
  experienceLevel?: string;
}

export function JobPostingForm({ 
  onSuccess, 
  onClose, 
  existingJob,
  initialCompanies,
  initialSkills 
}: JobPostingFormProps) {
  const { user } = usePrivy();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    title: existingJob?.title || '',
    company: existingJob?.company || '',
    location: existingJob?.location || '',
    salary: existingJob?.salary_range || '',
    jobType: existingJob?.job_type || '',
    blockchain: existingJob?.blockchain || '',
    description: existingJob?.description || '',
    experienceLevel: existingJob?.experience_level || '',
    selectedSkills: []
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [companies, setCompanies] = useState<Company[]>(initialCompanies || []);
  const [skills, setSkills] = useState<Skill[]>(initialSkills || []);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompanyDetails, setNewCompanyDetails] = useState({ name: '', website: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const experienceLevels = [
    "Entry-level",
    "Mid-level",
    "Senior-level",
    "Lead",
    "Manager",
    "Director",
    "Executive"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch companies and skills in parallel
        const [companiesResponse, skillsResponse] = await Promise.all([
          supabase.from('companies').select('*').order('name'),
          supabase.from('skills').select('*').order('name')
        ]);

        if (companiesResponse.data) {
          setCompanies(companiesResponse.data);
          
          // If editing and we have a company_id, set the company
          if (existingJob?.company_id) {
            const company = companiesResponse.data.find(c => c.id === existingJob.company_id);
            if (company) {
              setFormData(prev => ({ ...prev, company: company.name }));
            }
          }
        }

        if (skillsResponse.data) {
          setSkills(skillsResponse.data);
        }

        // Set selected skills if editing
        if (existingJob?.job_skills) {
          const selectedSkills = existingJob.job_skills.map(js => js.skills);
          setFormData(prev => ({ ...prev, selectedSkills }));
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [existingJob]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    }

    if (!formData.company) {
      errors.company = 'Company is required';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!formData.salary.trim()) {
      errors.salary = 'Salary range is required';
    }

    if (!formData.jobType) {
      errors.jobType = 'Job type is required';
    }

    if (!formData.blockchain) {
      errors.blockchain = 'Blockchain is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Job description is required';
    } else if (formData.description.length < 100) {
      errors.description = 'Description should be at least 100 characters';
    }

    if (formData.selectedSkills.length === 0) {
      errors.skills = 'At least one skill is required';
    }

    if (!formData.experienceLevel) {
      errors.experienceLevel = 'Experience level is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to post a job",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const userUuid = await getUserUuid(user.id);
      if (!userUuid) throw new Error('User profile not found');

      // Handle company
      let companyId = existingJob?.company_id;
      if (!companyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id')
          .eq('name', formData.company)
          .single();

        if (!companyData) {
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({ name: formData.company, website: newCompanyDetails.website })
            .select('id')
            .single();
          
          if (companyError) throw companyError;
          companyId = newCompany?.id;
        } else {
          companyId = companyData.id;
        }
      }

      const jobData = {
        title: formData.title.trim(),
        company_id: companyId,
        location: formData.location.trim(),
        salary_range: formData.salary.trim(),
        job_type: formData.jobType,
        blockchain: formData.blockchain,
        description: formData.description.trim(),
        experience_level: formData.experienceLevel,
        user_id: userUuid,
        status: 'active'
      };

      let result: { id: string };
      if (existingJob?.id) {
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

      // Add skills
      await Promise.all(formData.selectedSkills.map(skill => 
        supabase
          .from('job_skills')
          .insert({ job_id: result.id, skill_id: skill.id })
      ));

      toast({
        title: "Success",
        description: existingJob ? 'Job updated successfully!' : 'Job posted successfully!',
      });

      if (onSuccess) onSuccess();
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    } catch (error) {
      console.error('Error creating/updating job:', error);
      toast({
        title: "Error",
        description: existingJob ? 'Failed to update job' : 'Failed to create job',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldError = (error?: string) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-2 mt-1 text-destructive text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="space-y-4 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h2 className="font-medium mb-2">Job Posting Guidelines</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Fill in all required fields marked with *</li>
          <li>• Provide a detailed job description (minimum 100 characters)</li>
          <li>• Select at least one required skill</li>
          <li>• Ensure salary range is clear and competitive</li>
        </ul>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Job Title *</label>
        <Input
          placeholder="e.g., Smart Contract Developer"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={formErrors.title ? 'border-destructive' : ''}
        />
        {renderFieldError(formErrors.title)}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Company *</label>
        <div className="space-y-2">
          <Select
            value={formData.company}
            onValueChange={(value) => {
              if (value === 'new') {
                setIsNewCompanyDialogOpen(true);
              } else {
                setFormData(prev => ({ ...prev, company: value }));
              }
            }}
          >
            <SelectTrigger className={formErrors.company ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select or add a company" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2 border-b">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => setIsNewCompanyDialogOpen(true)}
                >
                  + Add New Company
                </Button>
              </div>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.name}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.company && companies.find(c => c.name === formData.company)?.website && (
            <p className="text-sm text-muted-foreground">
              Website: {companies.find(c => c.name === formData.company)?.website}
            </p>
          )}
          {renderFieldError(formErrors.company)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Location *</label>
          <Input
            placeholder="e.g., Remote, New York, etc."
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className={formErrors.location ? 'border-destructive' : ''}
          />
          {renderFieldError(formErrors.location)}
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Job Type *</label>
          <Select
            value={formData.jobType}
            onValueChange={(value) => setFormData({ ...formData, jobType: value })}
          >
            <SelectTrigger className={formErrors.jobType ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.map(type => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderFieldError(formErrors.jobType)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Blockchain *</label>
          <Select
            value={formData.blockchain}
            onValueChange={(value) => setFormData({ ...formData, blockchain: value })}
          >
            <SelectTrigger className={formErrors.blockchain ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select blockchain" />
            </SelectTrigger>
            <SelectContent>
              {blockchains.map(chain => (
                <SelectItem key={chain} value={chain.toLowerCase()}>
                  {chain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderFieldError(formErrors.blockchain)}
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Salary Range *</label>
          <Input
            placeholder="e.g., $120k - $180k"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            className={formErrors.salary ? 'border-destructive' : ''}
          />
          {renderFieldError(formErrors.salary)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Experience Level *</label>
          <Select
            value={formData.experienceLevel}
            onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
          >
            <SelectTrigger className={formErrors.experienceLevel ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map(level => (
                <SelectItem key={level} value={level.toLowerCase()}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderFieldError(formErrors.experienceLevel)}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Required Skills *</label>
        <div className="flex flex-wrap gap-2 mb-2">
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
        <Select
          value=""
          onValueChange={(value) => {
            const skill = skills.find(s => s.id === value);
            if (skill && !formData.selectedSkills.find(s => s.id === skill.id)) {
              setFormData(prev => ({
                ...prev,
                selectedSkills: [...prev.selectedSkills, skill]
              }));
            }
          }}
        >
          <SelectTrigger className={formErrors.skills ? 'border-destructive' : ''}>
            <SelectValue placeholder="Add skills" />
          </SelectTrigger>
          <SelectContent>
            {skills.map((skill) => (
              <SelectItem key={skill.id} value={skill.id}>
                {skill.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderFieldError(formErrors.skills)}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Job Description *</label>
        <Textarea
          placeholder="Describe the role, responsibilities, and requirements..."
          className={`min-h-[200px] ${formErrors.description ? 'border-destructive' : ''}`}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        {renderFieldError(formErrors.description)}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : existingJob ? 'Update Job' : 'Post Job'}
        </Button>
      </div>

      <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Company Name *</label>
              <Input
                placeholder="Enter company name"
                value={newCompanyDetails.name}
                onChange={(e) => setNewCompanyDetails(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Company Website</label>
              <Input
                placeholder="https://example.com"
                value={newCompanyDetails.website}
                onChange={(e) => setNewCompanyDetails(prev => ({
                  ...prev,
                  website: e.target.value
                }))}
              />
            </div>
            <Button 
              onClick={async () => {
                try {
                  if (!newCompanyDetails.name.trim()) {
                    toast({
                      title: "Error",
                      description: "Company name is required",
                      variant: "destructive"
                    });
                    return;
                  }

                  const { data, error } = await supabase
                    .from('companies')
                    .insert(newCompanyDetails)
                    .select()
                    .single();

                  if (error) throw error;

                  if (data) {
                    setCompanies(prev => [...prev, data]);
                    setFormData(prev => ({ ...prev, company: data.name }));
                    setIsNewCompanyDialogOpen(false);
                    toast({
                      title: "Success",
                      description: "Company added successfully",
                    });
                  }
                } catch (error) {
                  console.error('Error adding company:', error);
                  toast({
                    title: "Error",
                    description: "Failed to add company",
                    variant: "destructive"
                  });
                }
              }}
            >
              Add Company
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}