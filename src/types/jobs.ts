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
  user_id?: string;
  companyWebsite?: string;
  applicationsCount?: number;
  job_applications?: any[];
}

export interface Company {
  id: string;
  name: string;
  website: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
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
