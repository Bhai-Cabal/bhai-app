// components/Step2.tsx
import React, { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { LocationInput } from '@/components/LocationInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Step2Props {
  selectedLocation: string;
  setSelectedLocation: React.Dispatch<React.SetStateAction<string>>;
  getMaxDate: () => string;
  getMinDate: () => string;
}

const Step2: React.FC<Step2Props> = ({ selectedLocation, setSelectedLocation, getMaxDate, getMinDate }) => {
  const { control, formState: { errors }, setValue, watch } = useFormContext();
  const birthday = watch('birthday');
  const cryptoEntryMonth = watch('cryptoEntryMonth');
  const cryptoEntryYear = watch('cryptoEntryYear');

  // Update form when location is selected
  useEffect(() => {
    if (selectedLocation) {
      setValue('location', selectedLocation, { shouldValidate: true });
    }
  }, [selectedLocation, setValue]);

  // Update crypto_entry_date when month or year changes
  useEffect(() => {
    if (cryptoEntryMonth && cryptoEntryYear) {
      const formattedDate = `${cryptoEntryYear}-${cryptoEntryMonth}-01`;
      setValue('crypto_entry_date', formattedDate, { shouldValidate: true });
    }
  }, [cryptoEntryMonth, cryptoEntryYear, setValue]);

  // Validate birthday age
  const validateBirthday = (date: string) => {
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear(); // Change to let
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 13 && age <= 100;
  };

  // Format date for display
  const formatDate = (date: string) => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Generate month/year options for crypto entry
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2009; // Bitcoin genesis year
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
              <LocationInput 
                selectedLocation={selectedLocation} 
                setSelectedLocation={setSelectedLocation}
                error={errors.location?.message?.toString()}
              />
            </FormControl>
            <FormMessage>{errors.location?.message?.toString()}</FormMessage>
          </FormItem>
        )}
      />

      <Controller
        name="birthday"
        control={control}
        rules={{
          validate: {
            ageCheck: (value) => validateBirthday(value) || "You must be at least 13 years old and not older than 100 years.",
          }
        }}
        render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormLabel>Birthday</FormLabel>
            <FormDescription>
              Your date of birth (must be at least 13 years old)
            </FormDescription>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={formatDate(value)}
                onChange={(e) => {
                  const newDate = e.target.value;
                  onChange(newDate);
                  setValue('birthday', newDate, { 
                    shouldValidate: true,
                    shouldDirty: true 
                  });
                }}
                max={getMaxDate()}
                min={getMinDate()}
                className="text-lg p-6"
              />
            </FormControl>
            <FormMessage>{errors.birthday?.message?.toString()}</FormMessage>
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormLabel>When did you enter crypto?</FormLabel>
        <FormDescription>
          Select when you first got involved in crypto/web3
        </FormDescription>
        <div className="flex gap-4">
          <Controller
            name="cryptoEntryMonth"
            control={control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem 
                        key={month} 
                        value={(index + 1).toString().padStart(2, '0')}
                      >
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.cryptoEntryMonth?.message?.toString()}</FormMessage>
              </FormItem>
            )}
          />

          <Controller
            name="cryptoEntryYear"
            control={control}
            render={({ field }) => (
              <FormItem className="flex-1">
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.cryptoEntryYear?.message?.toString()}</FormMessage>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Step2;
