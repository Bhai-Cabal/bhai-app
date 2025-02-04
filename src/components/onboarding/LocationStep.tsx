// components/onboarding/LocationStep.tsx

import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface LocationStepProps {
  form: UseFormReturn<OnboardingFormValues>;
}

export default function LocationStep({ form }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormDescription>
              Where are you based? City and country preferred
            </FormDescription>
            <FormControl>
              <Input 
                placeholder="Tokyo, Japan" 
                {...field} 
                className="text-lg p-6"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="birthday"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Birthday</FormLabel>
            <FormDescription>
              Your date of birth
            </FormDescription>
            <FormControl>
              <Input 
                type="date" 
                {...field} 
                className="text-lg p-6"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cryptoEntryDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Crypto Entry Date</FormLabel>
            <FormDescription>
              When did you first get involved in crypto/web3?
            </FormDescription>
            <FormControl>
              <Input 
                type="date" 
                {...field} 
                className="text-lg p-6"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
