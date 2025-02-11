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
    .min(3, 'Username must be at least 3 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .nonempty('Username is required'),
  fullName: z.string().max(100, 'Full name must be less than 100 characters').nonempty('Full name is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').nonempty('Bio is required').min(10, 'Bio must be at least 10 characters long'),
  profilePicture: z.any().optional(),
  location: z.string().nonempty('Location is required'),
  birthday: z.string().nonempty('Birthday is required'),
  cryptoEntryDate: z.string().nonempty('Crypto entry date is required'),
  companies: z.array(
    z.object({
      companyId: z.string().optional(), // Added companyId  
      name: z.string().nonempty('Company name is required'),
      website: z.string().url('Invalid URL').optional(),
      role: z.string().nonempty('Role is required'),
      startDate: z.string().nonempty('Start date is required'),
      endDate: z.string().optional(),
      isCurrent: z.boolean(),
    })
  ),
  digitalIdentities: z.array(
    z.object({
      platform: z.string().nonempty('Platform is required'),
      identifier: z.string().nonempty('Identifier is required'),
    })
  ).min(2, 'At least two digital identities are required'),
  walletAddresses: z.array(
    z.object({
      blockchain: z.string().nonempty('Blockchain is required'),
      address: z.string().nonempty('Address is required'),
    })
  ).refine(wallets => wallets.some(wallet => wallet.blockchain === 'ethereum'), {
    message: 'Ethereum wallet address is required',
  }).refine(wallets => wallets.some(wallet => wallet.blockchain === 'solana'), {
    message: 'Solana wallet address is required',
  }),
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
