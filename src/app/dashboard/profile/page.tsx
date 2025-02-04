"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  username: z.string().min(3).max(50),
  fullName: z.string().min(2).max(100),
  location: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      fullName: "",
      location: "",
      bio: "",
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
        location: data.location,
        bio: data.bio || "",
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
          location: values.location,
          bio: values.bio,
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
              />
              <Button onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}