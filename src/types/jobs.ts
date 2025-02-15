export interface Job {
  id: string;
  title: string;
  company: string;
  companyWebsite?: string;
  location: string;
  salary_range: string;
  job_type: string;
  blockchain: string;
  experience_level: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  company_id: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  skills: string[];
  posted: string;
  postedBy: string;
  postedByAvatar?: string;
  applicationsCount: number;
}

export interface JobFormData {
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  blockchain: string;
  experienceLevel: string;
  description: string;
  skills: string[];
}
