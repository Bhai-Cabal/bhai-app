export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  applicant: {
    username: string;
    email: string;
    profile_picture_path?: string;
    wallet_address: string;
  };
  job: {
    title: string;
    company: string;
  };
}
