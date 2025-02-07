// components/onboarding/ProfessionalStep.tsx

import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Import your Supabase client
import { v4 as uuid } from 'uuid';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ProfessionalStepProps {
  form: UseFormReturn<OnboardingFormValues>;
}

const SKILL_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Elementary" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Expert" },
];

export default function ProfessionalStep({ form }: ProfessionalStepProps) {
  const [roles, setRoles] = useState<
    { id: string; name: string; label: string }[]
  >([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [skills, setSkills] = useState<
    { id: string; name: string; label: string }[]
  >([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [newRoleCategory, setNewRoleCategory] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newSkillDescription, setNewSkillDescription] = useState("");

  // Fetch roles and skills from Supabase on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("roles")
          .select("id, name");

        if (error) {
          console.error("Error fetching roles:", error);
          return;
        }

        setRoles(data.map((role) => ({ ...role, label: role.name })));
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    const fetchSkills = async () => {
      try {
        const { data, error } = await supabase
          .from("skills")
          .select("id, name");

        if (error) {
          console.error("Error fetching skills:", error);
          return;
        }

        setSkills(data.map((skill) => ({ ...skill, label: skill.name })));
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };

    fetchRoles();
    fetchSkills();
  }, []);

  const handleRoleChange = async (selectedValue: string) => {
    form.setValue("primaryRole", selectedValue);

    // If it's a new role, add it to the Supabase table
    if (selectedValue.startsWith("new-")) {
      const newRole = selectedValue.replace("new-", "");
      try {
        const { error } = await supabase
          .from("roles")
          .insert({ name: newRole.toLowerCase() }); // Store in lowercase

        if (error) {
          console.error("Error adding new role:", error);
          // Handle error (e.g., show an error message to the user)
        } else {
          // Update the local roles state with the new role
          setRoles([
            ...roles,
            { id: uuid(), name: newRole.toLowerCase(), label: newRole },
          ]);
          setNewRoleName(""); // Clear the input
        }
      } catch (error) {
        console.error("Error adding new role:", error);
      }
    }
  };

  const addSkill = () => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", [
      ...currentSkills,
      { name: "", proficiencyLevel: 1 },
    ]);
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter((_, i) => i !== index));
  };

  const handleSkillChange = async (
    index: number,
    selectedValue: string
  ) => {
    form.setValue(`skills.${index}.name`, selectedValue);

    // If it's a new skill, add it to the Supabase table
    if (selectedValue.startsWith("new-")) {
      const newSkill = selectedValue.replace("new-", "");
      try {
        const { error } = await supabase
          .from("skills")
          .insert({ name: newSkill.toLowerCase() }); // Store in lowercase

        if (error) {
          console.error("Error adding new skill:", error);
          // Handle error (e.g., show an error message to the user)
        } else {
          // Update the local skills state with the new skill
          setSkills([
            ...skills,
            { id: uuid(), name: newSkill.toLowerCase(), label: newSkill },
          ]);
          setNewSkillName(""); // Clear the input
        }
      } catch (error) {
        console.error("Error adding new skill:", error);
      }
    }
  };

  const handleAddNewRole = async () => {
    try {
      const { error } = await supabase
        .from("roles")
        .insert({ name: newRoleName.toLowerCase(), category: newRoleCategory, description: newRoleDescription });

      if (error) {
        console.error("Error adding new role:", error);
      } else {
        setRoles([...roles, { id: uuid(), name: newRoleName.toLowerCase(), label: newRoleName }]);
        setNewRoleName("");
        setNewRoleCategory("");
        setNewRoleDescription("");
        setIsRoleDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding new role:", error);
    }
  };

  const handleAddNewSkill = async () => {
    try {
      const { error } = await supabase
        .from("skills")
        .insert({ name: newSkillName.toLowerCase(), description: newSkillDescription });

      if (error) {
        console.error("Error adding new skill:", error);
      } else {
        setSkills([...skills, { id: uuid(), name: newSkillName.toLowerCase(), label: newSkillName }]);
        setNewSkillName("");
        setNewSkillDescription("");
        setIsSkillDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding new skill:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Role Select */}
      <FormField
        control={form.control}
        name="primaryRole"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Role</FormLabel>
            <FormDescription>
              Select your main role in the crypto/web3 space
            </FormDescription>
            <Select onValueChange={handleRoleChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="text-lg p-6">
                  <SelectValue placeholder="Select your primary role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px]">
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.label}
                  </SelectItem>
                ))}

                <div className="py-2">
                  <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsRoleDialogOpen(true)}>Add a new role</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Role</DialogTitle>
                        <DialogDescription>Fill in the details for the new role</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Role Name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                        <Input placeholder="Role Category" value={newRoleCategory} onChange={(e) => setNewRoleCategory(e.target.value)} />
                        <Textarea placeholder="Role Description" value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddNewRole}>Add Role</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Skills Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <FormLabel>Skills</FormLabel>
            <FormDescription>Add relevant skills for your role</FormDescription>
          </div>
          <Button type="button" variant="outline" onClick={addSkill}>
            Add Skill
          </Button>
        </div>
 
        {form.watch("skills").map((skill, index) => (
          <div key={index} className="flex gap-4 items-start">
            {/* Skill Name Select */}
            <FormField
              control={form.control}
              name={`skills.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Select
                    onValueChange={(value) => handleSkillChange(index, value)}
                    value={field.value} // Use field.value here
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {skills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.label}
                        </SelectItem>
                      ))}

                      <div className="py-2">
                        <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => setIsSkillDialogOpen(true)}>Add a new skill</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Skill</DialogTitle>
                              <DialogDescription>Fill in the details for the new skill</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input placeholder="Skill Name" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
                              <Textarea placeholder="Skill Description" value={newSkillDescription} onChange={(e) => setNewSkillDescription(e.target.value)} />
                            </div>
                            <DialogFooter>
                              <Button onClick={handleAddNewSkill}>Add Skill</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Proficiency Level Select */}
            <FormField
              control={form.control}
              name={`skills.${index}.proficiencyLevel`}
              render={({ field }) => (
                <FormItem className="w-[200px]">
                  <Select
                    onValueChange={(value) =>
                      field.onChange(parseInt(value, 10))
                    }
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SKILL_LEVELS.map((level) => (
                        <SelectItem
                          key={level.value}
                          value={level.value.toString()}
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSkill(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Skill Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsSkillDialogOpen(true)}>Add a new skill</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>Fill in the details for the new skill</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Skill Name" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
            <Textarea placeholder="Skill Description" value={newSkillDescription} onChange={(e) => setNewSkillDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleAddNewSkill}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
