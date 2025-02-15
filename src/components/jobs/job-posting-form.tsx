"use client";

import { useState, useEffect } from "react";
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from "@/lib/supabase";
import { getUserUuid } from '@/lib/user-helpers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
interface Skill {
  id: string;
  name: string;
  description: string;
}
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  website: string;
}

interface JobPostingFormProps {
  fetchJobs: () => void;
}

export function JobPostingForm({ fetchJobs }: JobPostingFormProps) {
  const { toast } = useToast();
  const { user } = usePrivy();
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    jobType: '',
    blockchain: '',
    description: '',
    experienceLevel: '',
    selectedSkills: [] as Skill[]
  });

  const [formErrors, setFormErrors] = useState({
    title: false,
    company: false,
    location: false,
    salary: false,
    jobType: false,
    blockchain: false,
    description: false
  });

  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompanyDetails, setNewCompanyDetails] = useState({
    name: '',
    website: ''
  });
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  // Skills state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [isNewSkillDialogOpen, setIsNewSkillDialogOpen] = useState(false);
  const [newSkillDetails, setNewSkillDetails] = useState({
    name: '',
    description: ''
  });

  // Fetch initial data
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

  // Handle form submission
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
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please login to post a job"
        });
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

      // First, get or create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', formData.company)
        .single();

      let companyId;
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

      // Create job posting
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
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
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Handle skills
      const skillPromises = formData.selectedSkills.map(async (skill: Skill) => {
        // Create job-skill association
        return supabase
          .from('job_skills')
          .insert({ job_id: jobData.id, skill_id: skill.id });
      });

      await Promise.all(skillPromises);
      fetchJobs();
      toast({
        title: "Success",
        description: "Job posted successfully!"
      });
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create job"
      });
    }
  };

  // ... rest of your component code (handleCompanySearch, handleSkillSearch, etc.) ...

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* ... your existing form JSX ... */}
    </form>
  );
}
