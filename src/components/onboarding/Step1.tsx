// components/Step1.tsx
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';

interface Step1Props {
  isUsernameTaken: boolean;
  handleUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
}

const Step1: React.FC<Step1Props> = ({ isUsernameTaken, handleUsernameChange, handleImageChange, imagePreview }) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormDescription>
              Choose a unique username that will identify you on the platform (minimum 3 characters)
            </FormDescription>
            <FormControl>
              <Input
                placeholder="satoshi"
                {...field}
                className="text-lg p-6"
                minLength={3}
                maxLength={50}
                onChange={handleUsernameChange}
              />
            </FormControl>
            {isUsernameTaken && <p className="text-red-500">Username is already taken</p>}
            <FormMessage />
          </FormItem>
        )}
      />

      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormDescription>
              Enter your full name as you'd like it to appear on your profile
            </FormDescription>
            <FormControl>
              <Input
                placeholder="Satoshi Nakamoto"
                {...field}
                className="text-lg p-6"
                maxLength={100}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Controller
        name="bio"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormDescription>
              Tell us about yourself (maximum 500 characters)
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Share a brief introduction about yourself..."
                className="min-h-[100px] text-lg p-6"
                maxLength={500}
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Controller
        name="profilePicture"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel>Profile Picture</FormLabel>
            <FormDescription>
              Upload a profile picture (max 5MB, .jpg, .png, .webp)
            </FormDescription>
            <FormControl>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="text-lg p-6"
                  {...field}
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
        )}
      />
    </div>
  );
};

export default Step1;
