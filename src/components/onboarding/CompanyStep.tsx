

// components/onboarding/CompanyStep.tsx

import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface CompanyStepProps {
  form: UseFormReturn<OnboardingFormValues>;
}
 
export default function CompanyStep({ form }: CompanyStepProps) {
  const addCompany = () => {
    const currentCompanies = form.getValues("companies");
    form.setValue("companies", [
      ...currentCompanies,
      {
        name: "",
        website: "",
        role: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
      },
    ]);
  };

  const removeCompany = (index: number) => {
    const currentCompanies = form.getValues("companies");
    form.setValue(
      "companies",
      currentCompanies.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Work Experience</FormLabel>
        <FormDescription>
          Add your current and previous work experience
        </FormDescription>
      </div>

      <div className="space-y-8">
        {form.watch("companies").map((company, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => removeCompany(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <FormField
              control={form.control}
              name={`companies.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="text-lg p-6" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`companies.${index}.website`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Website</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} className="text-lg p-6" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`companies.${index}.role`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input {...field} className="text-lg p-6" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`companies.${index}.startDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="text-lg p-6" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!company.isCurrent && (
                <FormField
                  control={form.control}
                  name={`companies.${index}.endDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="text-lg p-6" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name={`companies.${index}.isCurrent`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I currently work here
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addCompany}>
          Add Company
        </Button>
      </div>
    </div>
  );
}