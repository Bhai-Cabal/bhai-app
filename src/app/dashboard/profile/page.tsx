"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Step2 from "@/components/onboarding/Step2";
import Step3 from "@/components/onboarding/Step3";
import Step4 from "@/components/onboarding/Step4";
import Step5 from "@/components/onboarding/Step5";
import { Role, Skill } from "@/types/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const profileSchema = z.object({
  username: z.string().min(3).max(50),
  fullName: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  location: z.string().min(2).max(100),
  birthday: z.string().refine((date) => {
    const today = new Date();
    const birthDate = new Date(date);
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13 && age <= 100;
  }, {
    message: "You must be at least 13 years old and not older than 100 years.",
  }),
  crypto_entry_date: z.string().optional(), // Change back to optional
  cryptoEntryMonth: z.string().optional(),
  cryptoEntryYear: z.string().optional(),
  companies: z.array(z.object({
    companyId: z.string().optional(),
    name: z.string().optional(),
    website: z.string().optional(),
    role: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().nullable(),
    isCurrent: z.boolean().optional(),
  })).optional(),
  digitalIdentities: z.array(z.object({
    platform: z.string().optional(),
    identifier: z.string().optional(),
  })).optional(),
  walletAddresses: z.array(z.object({
    blockchain: z.string().optional(),
    address: z.string().optional(),
  })).optional(),
  roles: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
  })).optional(),
  skills: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
  })).optional(),
  profilePicture: z.instanceof(File).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newPlatform, setNewPlatform] = useState('');
  const [newBlockchain, setNewBlockchain] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [skillsData, setSkillsData] = useState<Skill[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      fullName: "",
      bio: "",
      location: "",
      birthday: "",
      crypto_entry_date: "",
      cryptoEntryMonth: "",
      cryptoEntryYear: "",
      companies: [],
      digitalIdentities: [],
      walletAddresses: [],
      roles: [],
      skills: [],
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      setIsLoading(true);
      // First get the user's database ID using the auth_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
        setIsLoading(false);
        return;
      }

      setDbUserId(userData.id);

      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          companies: user_companies (
            companyId: company_id,
            name: companies(name),
            website: companies(website),
            role,
            startDate: start_date,
            endDate: end_date,
            isCurrent: is_current
          ),
          digitalIdentities: digital_identities (
            platform,
            identifier
          ),
          walletAddresses: wallet_addresses (
            blockchain,
            address
          )
        `)
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to fetch profile. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Parse crypto entry date into month and year
      let cryptoMonth = "";
      let cryptoYear = "";
      
      if (data.crypto_entry_date) {
        const date = new Date(data.crypto_entry_date);
        cryptoMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        cryptoYear = date.getFullYear().toString();
      }

      form.reset({
        username: data.username || "",
        fullName: data.full_name || "",
        bio: data.bio || "",
        location: data.location || "",
        birthday: data.birthday || "",
        crypto_entry_date: data.crypto_entry_date || "",
        cryptoEntryMonth: cryptoMonth,
        cryptoEntryYear: cryptoYear,
        companies: data.companies || [],
        digitalIdentities: data.digitalIdentities || [],
        walletAddresses: data.walletAddresses || [],
        roles: data.roles || [],
        skills: data.skills || [],
      });

      // Also set the selected location
      setSelectedLocation(data.location || "");

      // Fetch available skills
      const { data: availableSkills, error: skillsError } = await supabase
        .from("skills")
        .select("id, name");

      if (!skillsError && availableSkills) {
        setSkillsData(availableSkills);
      }

      // Fetch available roles
      const { data: availableRoles, error: rolesError } = await supabase
        .from("roles")
        .select("id, name");

      if (!rolesError && availableRoles) {
        setRoles(availableRoles);
      }

      // Fetch selected skills
      const { data: selectedSkillsData, error: selectedSkillsError } = await supabase
        .from("skills")
        .select("id, name")
        .in("id", data.skill_ids);

      if (!selectedSkillsError && selectedSkillsData) {
        setSelectedSkills(selectedSkillsData);
        form.setValue("skills", selectedSkillsData);
      }

      // Fetch selected roles
      const { data: selectedRolesData, error: selectedRolesError } = await supabase
        .from("roles")
        .select("id, name")
        .in("id", data.role_ids);

      if (!selectedRolesError && selectedRolesData) {
        form.setValue("roles", selectedRolesData);
      }

      setIsLoading(false);
    }

    fetchProfile();
  }, [user?.id, form, toast]);

  useEffect(() => {
    // Fetch profile completion percentage
    const fetchProfileCompletion = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from("users")
        .select("profile_completion_percentage")
        .eq("auth_id", user.id)
        .single();

      if (!error && data) {
        setProfileCompletion(data.profile_completion_percentage);
      }
    };

    fetchProfileCompletion();
  }, [user?.id]);

  const validateSection = async (section: keyof ProfileFormValues): Promise<boolean> => {
    const fieldsToValidate: Partial<Record<keyof ProfileFormValues, string[]>> = {
      location: ['location', 'birthday', 'cryptoEntryMonth', 'cryptoEntryYear'],
      companies: ['companies'],
      digitalIdentities: ['digitalIdentities', 'roles', 'skills'],
      walletAddresses: ['walletAddresses'],
      username: ['username', 'fullName', 'bio'],
    };

    const fields = fieldsToValidate[section];
    if (!fields) return true;

    const isValid = await form.trigger(fields as any);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
    }
    return isValid;
  };

  async function onSubmitSection(section: keyof ProfileFormValues) {
    if (!user?.id) return;

    const isValid = await validateSection(section);
    if (!isValid) return;

    setIsLoading(true);

    try {
      const values = form.getValues();

      switch (section) {
        case 'location':
          // Format crypto entry date
          const cryptoEntryDate = values.cryptoEntryMonth && values.cryptoEntryYear 
            ? `${values.cryptoEntryYear}-${values.cryptoEntryMonth}-01`
            : null;

          await supabase
            .from("users")
            .update({
              location: values.location,
              birthday: values.birthday,
              crypto_entry_date: cryptoEntryDate, // Use single date field
            })
            .eq("auth_id", user.id);

          // Calculate new completion percentage
          const newPercentage = calculateCompletionPercentage({
            ...values,
            crypto_entry_date: cryptoEntryDate || undefined
          });

          // Update completion percentage
          await supabase
            .from("users")
            .update({ profile_completion_percentage: newPercentage })
            .eq("auth_id", user.id);

          setProfileCompletion(newPercentage);
          break;

        case 'companies':
          try {
            // First delete existing companies
            await supabase
              .from('user_companies')
              .delete()
              .eq('user_id', dbUserId);

            // Filter out invalid companies
            const validCompanies = values.companies?.filter(company => 
              company.name && company.role && company.startDate // Require name, role, and start date
            ) || [];

            // Process each company
            for (const company of validCompanies) {
              // Get or create company record
              const companyId = await getOrCreateCompany({
                name: company.name || "",
                website: company.website
              });

              // Validate dates
              if (company.isCurrent && company.endDate) {
                throw new Error("Current positions cannot have an end date");
              }

              if (!company.isCurrent && !company.endDate) {
                throw new Error("Non-current positions must have an end date");
              }

              if (company.endDate && company.startDate && new Date(company.endDate) <= new Date(company.startDate)) {
                throw new Error("End date must be after start date");
              }

              // Insert user_company record
              const { error: insertError } = await supabase
                .from('user_companies')
                .insert({
                  user_id: dbUserId,
                  company_id: companyId,
                  role: company.role,
                  start_date: company.startDate,
                  end_date: company.isCurrent ? null : company.endDate,
                  is_current: company.isCurrent || false
                });

              if (insertError) throw insertError;
            }

            // Calculate and update completion percentage
            const companiesPercentage = calculateCompletionPercentage({
              ...values,
              companies: validCompanies
            });

            const { error: updateError } = await supabase
              .from("users")
              .update({ profile_completion_percentage: companiesPercentage })
              .eq("auth_id", user.id);

            if (updateError) throw updateError;

            setProfileCompletion(companiesPercentage);

            toast({
              title: "Success",
              description: "Work experience has been updated successfully.",
            });
          } catch (error: any) {
            console.error("Error updating companies:", error);
            toast({
              title: "Error",
              description: error.message || "Failed to update work experience. Please try again.",
              variant: "destructive",
            });
            throw error; // Re-throw to trigger the error handling in onSubmitSection
          }
          break;

        case 'digitalIdentities':
          try {
            // Handle digital identities
            await supabase
              .from('digital_identities')
              .delete()
              .eq('user_id', dbUserId);

            if (values.digitalIdentities && values.digitalIdentities.length > 0) {
              const { error: identityError } = await supabase
                .from('digital_identities')
                .insert(values.digitalIdentities.map(identity => ({
                  user_id: dbUserId,
                  platform: identity.platform,
                  identifier: identity.identifier,
                })));

              if (identityError) throw identityError;
            }

            // Handle roles and skills
            const { error: userUpdateError } = await supabase
              .from("users")
              .update({
                role_ids: values.roles?.map(role => role.id) || [],
                skill_ids: values.skills?.map(skill => skill.id) || [],
              })
              .eq("auth_id", user.id);

            if (userUpdateError) throw userUpdateError;

            // Calculate and update completion percentage
            const digitalPresencePercentage = calculateCompletionPercentage({
              ...values,
            });

            const { error: updateError } = await supabase
              .from("users")
              .update({ profile_completion_percentage: digitalPresencePercentage })
              .eq("auth_id", user.id);

            if (updateError) throw updateError;

            setProfileCompletion(digitalPresencePercentage);

            toast({
              title: "Success",
              description: "Digital presence has been updated successfully.",
            });
          } catch (error: any) {
            console.error("Error updating digital presence:", error);
            toast({
              title: "Error",
              description: error.message || "Failed to update digital presence. Please try again.",
              variant: "destructive",
            });
            throw error;
          }
          break;

        case 'walletAddresses':
          try {
            await supabase
              .from('wallet_addresses')
              .delete()
              .eq('user_id', dbUserId);

            if (values.walletAddresses && values.walletAddresses.length > 0) {
              const { error: walletError } = await supabase
                .from('wallet_addresses')
                .insert(values.walletAddresses.map(wallet => ({
                  user_id: dbUserId,
                  blockchain: wallet.blockchain,
                  address: wallet.address,
                })));

              if (walletError) throw walletError;
            }

            // Calculate and update completion percentage
            const walletPercentage = calculateCompletionPercentage({
              ...values,
            });

            const { error: updateError } = await supabase
              .from("users")
              .update({ profile_completion_percentage: walletPercentage })
              .eq("auth_id", user.id);

            if (updateError) throw updateError;

            setProfileCompletion(walletPercentage);

            toast({
              title: "Success",
              description: "Wallet addresses have been updated successfully.",
            });
          } catch (error: any) {
            console.error("Error updating wallet addresses:", error);
            toast({
              title: "Error",
              description: error.message || "Failed to update wallet addresses. Please try again.",
              variant: "destructive",
            });
            throw error;
          }
          break;

        default:
          // Handle basic info and other simple fields
          await supabase
            .from("users")
            .update({ [section]: values[section] })
            .eq("auth_id", user.id);
      }

      // Update completion percentage
      const completionPercentage = calculateCompletionPercentage(values);
      await supabase
        .from("users")
        .update({ profile_completion_percentage: completionPercentage })
        .eq("auth_id", user.id);

      setProfileCompletion(completionPercentage);

      toast({
        title: "Success",
        description: `${section} has been updated successfully.`,
      });
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${section}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const addSkill = async () => {
    if (!newSkill.trim() || !user?.id) return;

    setIsLoading(true);
    try {
      // First, ensure the skill exists in the skills table
      const { data: skillData, error: skillError } = await supabase
        .from("skills")
        .insert({ name: newSkill })
        .select()
        .single();

      if (skillError && !skillError.message.includes("duplicate")) throw skillError;

      // Get the skill ID (either from the insert or existing skill)
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id")
        .eq("name", newSkill)
        .single();

      const skillId = skillData?.id || existingSkill?.id;

      // Add the skill to the user's skill_ids array
      const updatedSkills = [...selectedSkills, { id: skillId, name: newSkill }];
      setSelectedSkills(updatedSkills);

      // Update the user's skill_ids in the database
      const { error: updateError } = await supabase
        .from("users")
        .update({ skill_ids: updatedSkills.map(skill => skill.id) })
        .eq("auth_id", user.id);

      if (updateError) throw updateError;

      setNewSkill("");

      toast({
        title: "Skill added",
        description: "New skill has been added to your profile.",
      });
    } catch (error) {
      console.error("Error adding skill:", error);
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeSkill = async (skill: Skill) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data: skillData } = await supabase
        .from("skills")
        .select("id")
        .eq("name", skill.name)
        .single();

      if (skillData) {
        const updatedSkills = selectedSkills.filter(s => s.name !== skill.name);

        // Update the user's skill_ids in the database
        const { error } = await supabase
          .from("users")
          .update({ skill_ids: updatedSkills.map(skill => skill.id) })
          .eq("auth_id", user.id);

        if (error) throw error;

        setSelectedSkills(updatedSkills);

        toast({
          title: "Skill removed",
          description: "Skill has been removed from your profile.",
        });
      }
    } catch (error) {
      console.error("Error removing skill:", error);
      toast({
        title: "Error",
        description: "Failed to remove skill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        form.setError('profilePicture', {
          type: 'manual',
          message: 'File size must be less than 5MB',
        });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        form.setError('profilePicture', {
          type: 'manual',
          message: 'File must be in JPG, PNG, or WebP format',
        });
        return;
      }

      form.setValue('profilePicture', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlatformChange = async (index: number, selectedValue: string) => {
    const currentIdentities = form.getValues('digitalIdentities');
    if (selectedValue.startsWith('new-')) {
      const newPlatformName = selectedValue.replace('new-', '') || "";
      form.setValue(`digitalIdentities.${index}.platform`, newPlatformName);
    } else {
      form.setValue(`digitalIdentities.${index}.platform`, selectedValue || "");
    }
  };

  const handleBlockchainChange = async (index: number, selectedValue: string) => {
    const currentWallets = form.getValues('walletAddresses');
    if (selectedValue.startsWith('new-')) {
      const newBlockchainName = selectedValue.replace('new-', '') || "";
      form.setValue(`walletAddresses.${index}.blockchain`, newBlockchainName);
    } else {
      form.setValue(`walletAddresses.${index}.blockchain`, selectedValue || "");
    }
  };

  const addCompany = () => {
    const currentCompanies = form.getValues('companies') || [];
    form.setValue('companies', [
      ...currentCompanies,
      {
        companyId: '',
        name: '',
        website: '',
        role: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
      },
    ]);
  };

  const removeCompany = (index: number) => {
    const currentCompanies = form.getValues('companies') || [];
    form.setValue(
      'companies',
      currentCompanies.filter((_, i) => i !== index)
    );
  };

  const addIdentity = () => {
    const currentIdentities = form.getValues('digitalIdentities') || [];
    form.setValue('digitalIdentities', [
      ...currentIdentities,
      { platform: '', identifier: '' },
    ]);
  };

  const removeIdentity = (index: number) => {
    const currentIdentities = form.getValues('digitalIdentities') || [];
    form.setValue(
      'digitalIdentities',
      currentIdentities.filter((_, i) => i !== index)
    );
  };

  const addWallet = () => {
    const currentWallets = form.getValues('walletAddresses') || [];
    form.setValue('walletAddresses', [
      ...currentWallets,
      { blockchain: '', address: '' },
    ]);
  };

  const removeWallet = (index: number) => {
    const currentWallets = form.getValues('walletAddresses') || [];
    form.setValue(
      'walletAddresses',
      currentWallets.filter((_, i) => i !== index)
    );
  };

  const handleRoleChange = async (index: number, selectedValue: string) => {
    const selectedRole = roles.find((role) => role.name === selectedValue);
    if (selectedRole) {
      const currentRoles = form.getValues('roles') || [];
      form.setValue('roles', [
        ...currentRoles,
        { id: selectedRole.id, name: selectedRole.name },
      ]);
    }
  };

  const handleSkillSelect = (skill: Skill) => {
    const currentSkills = form.getValues('skills') || [];
    if (!currentSkills.some((s) => s.id === skill.id)) {
      form.setValue('skills', [...currentSkills, skill]);
    }
  };

  const handleSkillInputChange = (value: string) => {
    setSkillInput(value);
  };

  const removeRole = (index: number) => {
    const currentRoles = form.getValues('roles') || [];
    form.setValue(
      'roles',
      currentRoles.filter((_, i) => i !== index)
    );
  };

  const addRole = () => {
    const currentRoles = form.getValues('roles') || [];
    form.setValue('roles', [
      ...currentRoles,
      { id: '', name: '' },
    ]);
  };

  const calculateCompletionPercentage = (values: ProfileFormValues): number => {
    let percentage = 0;
    let totalSections = 0;

    // Basic Info (20%)
    if (values.username && values.fullName) {
      percentage += 20;
      totalSections++;
    }

    // Location & Birthday (20%)
    if (values.location && values.birthday && values.crypto_entry_date) {
      percentage += 20;
      totalSections++;
    }

    // Work Experience (20%)
    if (values.companies && values.companies.length > 0) {
      percentage += 20;
      totalSections++;
    }

    // Digital Presence (20%)
    if (values.digitalIdentities && values.digitalIdentities.length > 0) {
      percentage += 20;
      totalSections++;
    }

    // Wallet Addresses (20%)
    if (values.walletAddresses && values.walletAddresses.length > 0) {
      percentage += 20;
      totalSections++;
    }

    return totalSections > 0 ? Math.round(percentage) : 0;
  };

  const getMaxDate = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    return date.toISOString().split('T')[0];
  };

  const getMinDate = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 100);
    return date.toISOString().split('T')[0];
  };

  // Add this function to handle company creation/lookup
  const getOrCreateCompany = async (companyData: { name: string; website?: string | null }) => {
    if (!companyData.name) throw new Error("Company name is required");
    
    // First try to find existing company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyData.name)
      .single();
  
    if (existingCompany) {
      return existingCompany.id;
    }
  
    // If not found, create new company
    const { data: newCompany, error } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        website: companyData.website || null
      })
      .select('id')
      .single();
  
    if (error) throw error;
    return newCompany.id;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {profileCompletion < 100 && (
        <div className="mb-8">
          <div className="bg-background rounded-lg p-6 border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Profile Completion</h2>
              <span className="text-2xl font-bold">{profileCompletion}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-4 mb-4">
              <div 
                className="bg-primary h-4 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            {/* Section completion status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <CompletionItem
                title="Basic Info"
                isComplete={!!form.getValues('username') && !!form.getValues('fullName')}
                contribution={20}
              />
              <CompletionItem
                title="Location & Birthday"
                isComplete={!!form.getValues('location') && !!form.getValues('birthday')}
                contribution={20}
              />
              <CompletionItem
                title="Work Experience"
                isComplete={(form.getValues('companies') ?? []).length > 0}
                contribution={20}
              />
              <CompletionItem
                title="Digital Presence"
                isComplete={(form.getValues('digitalIdentities') ?? []).length > 0}
                contribution={20}
              />
              <CompletionItem
                title="Wallet Addresses"
                isComplete={(form.getValues('walletAddresses') ?? []).length > 0}
                contribution={20}
              />
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      ) : (
        <FormProvider {...form}>
          <form className="space-y-6">
            <Card id="basic-info" className="p-6 space-y-4 scroll-mt-20">
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field }) => <Input {...field} value={field.value || ""} />}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Controller
                    name="fullName"
                    control={form.control}
                    render={({ field }) => <Input {...field} value={field.value || ""} />}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Controller
                    name="bio"
                    control={form.control}
                    render={({ field }) => (
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="text-lg p-6"
                    />
                    {imagePreview && (
                      <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-primary">
                        <img src={imagePreview} alt="Profile preview" className="object-cover" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
              <Button type="button" onClick={() => onSubmitSection('username')}>
                Save Basic Info
              </Button>
            </Card>

            <Card id="location-birthday" className="p-6 scroll-mt-20">
              <Step2
                selectedLocation={selectedLocation || ""}
                setSelectedLocation={setSelectedLocation}
                getMaxDate={getMaxDate}
                getMinDate={getMinDate}
              />
              <Button 
                type="button" 
                onClick={() => onSubmitSection('location')}
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Location and Birthday'
                )}
              </Button>
            </Card>

            <Card id="work-experience" className="p-6 scroll-mt-20">
              <Step3 
                addCompany={addCompany} 
                removeCompany={removeCompany} 
              />
              <Button 
                type="button" 
                onClick={() => onSubmitSection('companies')}
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Work Experience'
                )}
              </Button>
            </Card>

            <Card id="digital-presence" className="p-6 scroll-mt-20">
              <Step4
                PLATFORMS={['Twitter', 'GitHub', 'LinkedIn', 'Discord', 'Telegram', 'Medium']}
                roles={roles}
                skills={skillsData}
                newPlatform={newPlatform}
                setNewPlatform={setNewPlatform}
                handlePlatformChange={handlePlatformChange}
                handleRoleChange={handleRoleChange}
                handleSkillInputChange={handleSkillInputChange}
                handleSkillSelect={handleSkillSelect}
                removeIdentity={removeIdentity}
                removeRole={removeRole}
                removeSkill={removeSkill}
                addIdentity={addIdentity}
                addRole={addRole}
                skillInput={skillInput}
                skillSuggestions={skillSuggestions}
                selectedSkills={selectedSkills}
                identityWarning=""
              />
              <Button 
                type="button" 
                onClick={() => onSubmitSection('digitalIdentities')}
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Digital Identities and Skills'
                )}
              </Button>
            </Card>

            <Card id="wallet-addresses" className="p-6 scroll-mt-20">
              <Step5
                BLOCKCHAINS={['Ethereum', 'Polygon', 'Solana', 'Bitcoin', 'Arbitrum', 'Optimism']}
                newBlockchain={newBlockchain}
                setNewBlockchain={setNewBlockchain}
                handleBlockchainChange={handleBlockchainChange}
                removeWallet={removeWallet}
                addWallet={addWallet}
                walletWarning=""
              />
              <Button 
                type="button" 
                onClick={() => onSubmitSection('walletAddresses')}
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Wallet Addresses'
                )}
              </Button>
            </Card>
          </form>
        </FormProvider>
      )}
    </div>
  );
}

const CompletionItem: React.FC<{
  title: string;
  isComplete: boolean;
  contribution: number;
}> = ({ title, isComplete, contribution }) => {
  // Function to get section ID based on title
  const getSectionId = (title: string) => {
    switch (title) {
      case "Basic Info":
        return "basic-info";
      case "Location & Birthday":
        return "location-birthday";
      case "Work Experience":
        return "work-experience";
      case "Digital Presence":
        return "digital-presence";
      case "Wallet Addresses":
        return "wallet-addresses";
      default:
        return "";
    }
  };

  return (
    <a 
      href={`#${getSectionId(title)}`}
      className="block transition-all hover:scale-[1.02] hover:shadow-md"
    >
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card group cursor-pointer">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isComplete ? 'bg-green-500' : 'bg-secondary'
        }`}>
          {isComplete ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <Link className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">{title || ""}</p>
          <p className="text-sm text-muted-foreground">
            {isComplete ? 'Completed' : `${contribution}% of profile`}
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-muted-foreground">Click to navigate</span>
        </div>
      </div>
    </a>
  );
};