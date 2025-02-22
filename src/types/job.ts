export interface Job {
  id: string;
  title: string;
  company: string;
  company_id?: string;
  location: string;
  job_type: string;
  blockchain: string;
  description: string;
  skills?: string[];
  salary_range: string;
  experience_level: string;
  status: string;
  created_at: string;
  job_skills?: {
    skill_id: string;
    skills: Skill;
  }[];
  user_id?: string;
  applications?: JobApplication[];
  companies?: Company;
  companyWebsite?: string;
  applicationsCount?: number;
  postedBy?: string;
  postedByAvatar?: string;
  posted?: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
}

export interface JobApplication {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  user_id: string;
  users?: {
    id: string;
    full_name: string;
    profile_picture_path: string;
    email: string;
  };
}
