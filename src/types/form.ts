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
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  fullName: z.string().max(100, 'Full name must be less than 100 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters'),
  profilePicture: z.any().optional(),
  location: z.string().optional(),
  birthday: z.string().optional(),
  cryptoEntryDate: z.string().optional(),
  companies: z.array(
    z.object({
      name: z.string(),
      website: z.string().url().optional(),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      isCurrent: z.boolean(),
    })
  ),
  digitalIdentities: z.array(
    z.object({
      platform: z.string(),
      identifier: z.string(),
    })
  ),
  walletAddresses: z.array(
    z.object({
      blockchain: z.string(),
      address: z.string(),
    })
  ),
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })  
  ),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});

export type OnboardingFormValues = z.infer<typeof formSchema>;
