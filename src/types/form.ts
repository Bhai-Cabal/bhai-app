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
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(2, "Full name is required"),
  bio: z.string().min(1, "Bio is required"),
  email: z.string().email().optional(),
  profilePicture: z.any().optional(),
});

export type OnboardingFormValues = z.infer<typeof formSchema>;
