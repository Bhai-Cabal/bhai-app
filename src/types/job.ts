export interface Job {
  id: string;
  title: string;
  company: string;
  company_id?: string;
  location: string;
  salary_range: string;
  job_type: string;
  blockchain: string;
  description: string;
  skills: string[];
  created_at: string;
  status: string;
  user_id?: string;
  applications?: JobApplication[];
  companies?: Company;
  job_skills?: JobSkill[];
  experience_level?: string;
  companyWebsite?: string;
  applicationsCount?: number;
  postedBy?: string;
  postedByAvatar?: string;
  posted?: string;
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

export interface JobSkill {
  skills: Skill;
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
