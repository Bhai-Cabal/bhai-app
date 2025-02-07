import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Control } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";

interface BasicInfoStepProps {
  control: Control<OnboardingFormValues>;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BasicInfoStep = ({ control, imagePreview, handleImageChange }: BasicInfoStepProps) => {
  return (
    <div className="space-y-6">
      {/* Username field */}
      <FormField
        control={control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormDescription>
              Choose a unique username (minimum 3 characters)
            </FormDescription>
            <FormControl>
              <Input
                placeholder="satoshi"
                {...field}
                className="text-lg p-6"
                minLength={3}
                maxLength={50}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Full Name field */}
      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormDescription>
              Enter your full name
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

      {/* Bio field */}
      <FormField
        control={control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormDescription>
              Tell us about yourself (maximum 500 characters)
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Share a brief introduction..."
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

      {/* Profile Picture field */}
      <FormField
        control={control}
        name="profilePicture"
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
                    <Image
                      src={imagePreview}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
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