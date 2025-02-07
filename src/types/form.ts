// types/form.ts
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export type OnboardingFormValues = {

  username: string;

  fullName: string;

  bio: string;

  profilePicture?: File;

  location: string;

  birthday: string;

  cryptoEntryDate: string;

  companies: {

    name: string;

    website: string;

    role: string;

    startDate: string;

    endDate: string;

    isCurrent: boolean;

  }[];

  digitalIdentities: {

    platform: string;

    identifier: string;

  }[];

  walletAddresses: {

    blockchain: string;

    address: string;

  }[];

  roles: {

    value: string;

  }[];

  skills: {

    value: string;

  }[];

};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, and .-_"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  profilePicture: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, "Max image size is 5MB")
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    ),
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(100, "Location must be less than 100 characters"),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date"),
  cryptoEntryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date"),
  primaryRole: z.string(),
  skills: z.array(
    z.object({
      name: z.string(),
      proficiencyLevel: z.number().min(1).max(5),
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
});