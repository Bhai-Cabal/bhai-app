// components/onboarding/DigitalIdentityStep.tsx

import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

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
            <FormField
              control={form.control}
              name={`digitalIdentities.${index}.platform`}
              render={({ field }) => (
                <FormItem className="w-[200px]">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLATFORMS.map((platform) => (
                        <SelectItem key={platform} value={platform.toLowerCase()}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`digitalIdentities.${index}.identifier`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input 
                      placeholder="Username or profile URL" 
                      {...field} 
                      className="text-lg p-6"
                    />
                  </FormControl>
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
