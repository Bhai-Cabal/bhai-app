import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Select from 'react-select';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationStepProps {
  form: UseFormReturn<OnboardingFormValues>;
}

// Sample list of locations
const LOCATIONS = [
  { value: "New York, United States", label: "New York, United States" },
  { value: "London, United Kingdom", label: "London, United Kingdom" },
  { value: "Tokyo, Japan", label: "Tokyo, Japan" },
  { value: "Paris, France", label: "Paris, France" },
  { value: "Singapore", label: "Singapore" },
  { value: "Hong Kong", label: "Hong Kong" },
  { value: "Dubai, United Arab Emirates", label: "Dubai, United Arab Emirates" },
  { value: "Berlin, Germany", label: "Berlin, Germany" },
  { value: "Toronto, Canada", label: "Toronto, Canada" },
  { value: "Sydney, Australia", label: "Sydney, Australia" },
  { value: "Seoul, South Korea", label: "Seoul, South Korea" },
  { value: "Mumbai, India", label: "Mumbai, India" },
  { value: "São Paulo, Brazil", label: "São Paulo, Brazil" },
  { value: "Amsterdam, Netherlands", label: "Amsterdam, Netherlands" },
  { value: "Stockholm, Sweden", label: "Stockholm, Sweden" },
  { value: "Zürich, Switzerland", label: "Zürich, Switzerland" },
  { value: "Tel Aviv, Israel", label: "Tel Aviv, Israel" },
  { value: "Shanghai, China", label: "Shanghai, China" },
  { value: "San Francisco, United States", label: "San Francisco, United States" },
  { value: "Miami, United States", label: "Miami, United States" },
];
 
export default function LocationStep({ form }: LocationStepProps) {
  const getMaxDate = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13); // Minimum age of 13
    return date.toISOString().split('T')[0];
  };

  const getMinDate = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 100); // Maximum age of 100
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Location</FormLabel>
            <FormDescription>
              Where are you based? Select your city and country
            </FormDescription>
            <FormControl>
              <Select
                options={LOCATIONS}
                onChange={(selectedOption) => form.setValue("location", selectedOption?.value || "")}
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
              Your date of birth (must be at least 13 years old)
            </FormDescription>
            <FormControl>
              <Input 
                type="date" 
                {...field} 
                max={getMaxDate()}
                min={getMinDate()}
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
                max={new Date().toISOString().split('T')[0]}
                min="2009-01-03" // Bitcoin genesis block date
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
