// components/onboarding/DigitalIdentityStep.tsx

import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Import Supabase client

interface DigitalIdentityStepProps {
  form: UseFormReturn<OnboardingFormValues>;
}

const PLATFORMS = [
  "Twitter",
  "GitHub",
  "LinkedIn",
  "Discord",
  "Telegram",
  "Medium",
];

export default function DigitalIdentityStep({ form }: DigitalIdentityStepProps) {
  const [newPlatform, setNewPlatform] = useState('');

  const addIdentity = () => {
    const currentIdentities = form.getValues("digitalIdentities");
    form.setValue("digitalIdentities", [
      ...currentIdentities,
      { platform: "", identifier: "" },
    ]);
  };

  const removeIdentity = (index: number) => {
    const currentIdentities = form.getValues("digitalIdentities");
    form.setValue(
      "digitalIdentities",
      currentIdentities.filter((_, i) => i !== index)
    );
  };

  const handlePlatformChange = async (
    index: number,
    selectedValue: string
  ) => {
    form.setValue(`digitalIdentities.${index}.platform`, selectedValue);

    // If it's a new platform, add it to the PLATFORMS array
    if (selectedValue.startsWith("new-")) {
      const newPlatformName = selectedValue.replace("new-", "");
      PLATFORMS.push(newPlatformName);
      setNewPlatform(""); // Clear the input
    }
  };
 
  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Digital Identities</FormLabel>
        <FormDescription>
          Add your social media and professional profiles
        </FormDescription>
      </div>

      <div className="space-y-4">
        {form.watch("digitalIdentities").map((_, index) => (
          <div key={index} className="flex gap-4 items-start">
            {/* Platform Select */}
            <FormField
              control={form.control}
              name={`digitalIdentities.${index}.platform`}
              render={({ field }) => (
                <FormItem className="w-[200px]">
                  <Select
                    onValueChange={(value) =>
                      handlePlatformChange(index, value)
                    }
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLATFORMS.map((platform) => (
                        <SelectItem
                          key={platform}
                          value={platform.toLowerCase()}
                        >
                          {platform}
                        </SelectItem>
                      ))}

                      {/* Input for adding a new platform */}
                      <div className="py-2">
                        <Input
                          placeholder="Add new platform"
                          value={newPlatform}
                          onChange={(e) => setNewPlatform(e.target.value)}
                          className="text-lg p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      {newPlatform && (
                        <SelectItem
                          key="new-platform"
                          value={`new-${newPlatform}`}
                        >
                          Add "{newPlatform}"
                        </SelectItem>
                      )}
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
              onClick={() => removeIdentity(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addIdentity}>
          Add Digital Identity
        </Button>
      </div>
    </div>
  );
}
