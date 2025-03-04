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
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters"),
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters"),  // Removed max length
  bio: z.string()
    .min(1, "Bio is required")
    .max(500, "Bio must be less than 500 characters"),
  location: z.string()
    .min(2, "Location is required"),
  email: z.string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")), // Allow empty string
  profilePicture: z.any().optional(),
});

export type OnboardingFormValues = z.infer<typeof formSchema>;
