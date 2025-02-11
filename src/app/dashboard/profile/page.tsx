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
  FormDescription,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
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
  birthday: z.string().optional(),
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
  skills: z.array(z.string()).optional(),
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

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
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
        digitalIdentities: data.digital_identities || [],
        walletAddresses: data.wallet_addresses || [],
        roles: data.roles || [],
        skills: data.skills || [],
      });

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("user_skills")
        .select("skills(name)")
        .eq("user_id", user.id);

      if (!skillsError && skillsData) {
        const skillNames = skillsData.map((s: any) => s.skills.name);
        setSkills(skillNames);
      }
    }

    fetchProfile();
  }, [user?.id, form]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: values.username,
          full_name: values.fullName,
          bio: values.bio,
          location: values.location,
          birthday: values.birthday,
          crypto_entry_date: values.cryptoEntryDate,
          companies: values.companies,
          digital_identities: values.digitalIdentities,
          wallet_addresses: values.walletAddresses,
          roles: values.roles,
          skills: values.skills,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const addSkill = async () => {
    if (!newSkill.trim() || !user?.id) return;

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

      // Add the user-skill relationship
      const { error: relationError } = await supabase
        .from("user_skills")
        .insert({
          user_id: user.id,
          skill_id: skillId,
        });

      if (relationError) throw relationError;

      setSkills([...skills, newSkill]);
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
    }
  };

  const removeSkill = async (skillName: string) => {
    if (!user?.id) return;

    try {
      const { data: skillData } = await supabase
        .from("skills")
        .select("id")
        .eq("name", skillName)
        .single();

      if (skillData) {
        const { error } = await supabase
          .from("user_skills")
          .delete()
          .eq("user_id", user.id)
          .eq("skill_id", skillData.id);

        if (error) throw error;

        setSkills(skills.filter(s => s !== skillName));

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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
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
          </Card>

          <Card className="p-6">
            <Step2
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              getMaxDate={() => new Date().toISOString().split('T')[0]}
              getMinDate={() => new Date().toISOString().split('T')[0]}
            />
          </Card>

          <Card className="p-6">
            <Step3 addCompany={() => {}} removeCompany={() => {}} />
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
          </Card>

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}