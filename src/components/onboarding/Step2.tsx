// components/Step2.tsx
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { LocationInput } from '@/components/LocationInput';

interface Step2Props {
  selectedLocation: string;
  setSelectedLocation: React.Dispatch<React.SetStateAction<string>>;
  getMaxDate: () => string;
  getMinDate: () => string;
}

const Step2: React.FC<Step2Props> = ({ selectedLocation, setSelectedLocation, getMaxDate, getMinDate }) => {
  const { control, formState: { errors }, setValue } = useFormContext();

  React.useEffect(() => {
    setValue('location', selectedLocation);
  }, [selectedLocation, setValue]);

  return (
    <div className="space-y-6">
      <Controller
        name="location"
        control={control}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Location</FormLabel>
            <FormDescription>
              Start typing to get location suggestions
            </FormDescription>
            <FormControl>
              <LocationInput selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
            </FormControl>
            <FormMessage>{errors.location?.message?.toString()}</FormMessage>
          </FormItem>
        )}
      />

      <Controller
        name="birthday"
        control={control}
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
            <FormMessage>{errors.birthday?.message?.toString()}</FormMessage>
          </FormItem>
        )}
      />

      <Controller
        name="cryptoEntryDate"
        control={control}
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
            <FormMessage>{errors.cryptoEntryDate?.message?.toString()}</FormMessage>
          </FormItem>
        )}
      />
    </div>
  );
};

export default Step2;
