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
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Step2 from "@/components/onboarding/Step2";
import Step3 from "@/components/onboarding/Step3";
import Step4 from "@/components/onboarding/Step4";
import Step5 from "@/components/onboarding/Step5";
import { Role, Skill } from "@/types/form";

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
  }).optional(),
  cryptoEntryDate: z.string().optional(),
  companies: z.array(z.object({
    companyId: z.string().optional(),
    name: z.string().optional(),
    website: z.string().optional(),
    role: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      fullName: "",
      bio: "",
      location: "",
      birthday: "",
      cryptoEntryDate: "",
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

      form.reset({
        username: data.username,
        fullName: data.full_name,
        bio: data.bio || "",
        location: data.location,
        birthday: data.birthday,
        cryptoEntryDate: data.crypto_entry_date,
        companies: data.companies || [],
        digitalIdentities: data.digitalIdentities || [],
        walletAddresses: data.walletAddresses || [],
        roles: data.roles || [],
        skills: data.skills || [],
      });

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

  async function onSubmitSection(section: keyof ProfileFormValues) {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const values = form.getValues();
      const updateData: Partial<ProfileFormValues> = { [section]: values[section] };

      if (section === 'companies') {
        // Update companies
        await supabase.from('user_companies').delete().eq('user_id', user.id);
        for (const company of values.companies ?? []) {
          await supabase.from('user_companies').insert({
            user_id: user.id,
            company_id: company.companyId,
            role: company.role,
            start_date: company.startDate,
            end_date: company.endDate,
            is_current: company.isCurrent,
          });
        }
      } else if (section === 'digitalIdentities') {
        // Update digital identities
        await supabase.from('digital_identities').delete().eq('user_id', user.id);
        for (const identity of values.digitalIdentities ?? []) {
          await supabase.from('digital_identities').insert({
            user_id: user.id,
            platform: identity.platform,
            identifier: identity.identifier,
          });
        }
      } else if (section === 'walletAddresses') {
        // Update wallet addresses
        await supabase.from('wallet_addresses').delete().eq('user_id', user.id);
        for (const wallet of values.walletAddresses || []) {
          await supabase.from('wallet_addresses').insert({
            user_id: user.id,
            blockchain: wallet.blockchain,
            address: wallet.address,
          });
        }
      } else if (section === 'roles' || section === 'skills') {
        // Update roles or skills
        const { error } = await supabase
          .from("users")
          .update({
            role_ids: values.roles.map(role => role.id),
            skill_ids: values.skills.map(skill => skill.id),
          })
          .eq("auth_id", user.id);

        if (error) throw error;
      } else {
        // Update other fields
        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("auth_id", user.id);

        if (error) throw error;
      }

      toast({
        title: "Profile updated",
        description: `Your ${section} has been successfully updated.`,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
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

  const removeSkill = async (skillName: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data: skillData } = await supabase
        .from("skills")
        .select("id")
        .eq("name", skillName)
        .single();

      if (skillData) {
        const updatedSkills = selectedSkills.filter(s => s.name !== skillName);

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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      ) : (
        <FormProvider {...form}>
          <form className="space-y-6">
            <Card className="p-6 space-y-4">
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field }) => <Input {...field} />}
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
                    render={({ field }) => <Input {...field} />}
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

            <Card className="p-6">
              <Step2
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                getMaxDate={() => new Date().toISOString().split('T')[0]}
                getMinDate={() => new Date().toISOString().split('T')[0]}
              />
              <Button type="button" onClick={() => onSubmitSection('location')}>
                Save Location and Birthday
              </Button>
            </Card>

            <Card className="p-6">
              <Step3 addCompany={() => {}} removeCompany={() => {}} />
              <Button type="button" onClick={() => onSubmitSection('companies')}>
                Save Work Experience
              </Button>
            </Card>

            <Card className="p-6">
              <Step4
                PLATFORMS={['Twitter', 'GitHub', 'LinkedIn', 'Discord', 'Telegram', 'Medium']}
                roles={roles}
                skills={skillsData}
                newPlatform={newPlatform}
                setNewPlatform={setNewPlatform}
                handlePlatformChange={() => {}}
                handleRoleChange={() => {}}
                handleSkillInputChange={() => {}}
                handleSkillSelect={() => {}}
                removeIdentity={() => {}}
                removeRole={() => {}}
                removeSkill={() => {}}
                addIdentity={() => {}}
                addRole={() => {}}
                skillInput={skillInput}
                skillSuggestions={skillSuggestions}
                selectedSkills={selectedSkills}
              />
              <Button type="button" onClick={() => onSubmitSection('digitalIdentities')}>
                Save Digital Identities and Skills
              </Button>
            </Card>

            <Card className="p-6">
              <Step5
                BLOCKCHAINS={['Ethereum', 'Polygon', 'Solana', 'Bitcoin', 'Arbitrum', 'Optimism']}
                newBlockchain={newBlockchain}
                setNewBlockchain={setNewBlockchain}
                handleBlockchainChange={() => {}}
                removeWallet={() => {}}
                addWallet={() => {}}
              />
              <Button type="button" onClick={() => onSubmitSection('walletAddresses')}>
                Save Wallet Addresses
              </Button>
            </Card>
          </form>
        </FormProvider>
      )}
    </div>
  );
}