// types/form.ts
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export interface Role {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
}

export interface Company {
  companyId?: string; // Added companyId
  name: string;
  website: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface DigitalIdentity {
  platform: string;
  identifier: string;
}

export interface WalletAddress {
  blockchain: string;
  address: string;
}

// Removed duplicate OnboardingFormValues interface

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// types/form.ts

export const formSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  
  bio: z.string()
    .min(10, 'Bio must be at least 10 characters')
    .max(500, 'Bio must be less than 500 characters'),
  
  location: z.string()
    .min(1, 'Location is required'),
  
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.string().length(0)),
  
  profilePicture: z.any()
    .optional()
    .nullable() // Make it explicitly nullable
    .refine((file) => {
      if (!file) return true; // Allow null/undefined values
      return file.size <= 5 * 1024 * 1024;
    }, 'File size must be less than 5MB')
    .refine((file) => {
      if (!file) return true; // Allow null/undefined values
      return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    }, 'File must be in JPG, PNG, or WebP format'),
});

export type OnboardingFormValues = z.infer<typeof formSchema>;
