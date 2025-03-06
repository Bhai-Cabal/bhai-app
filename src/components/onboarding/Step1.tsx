// components/Step1.tsx
import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { LocationInput } from '@/components/LocationInput';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Step1Props {
  isUsernameTaken: boolean;
  handleUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  userEmail: string | null;
  isWalletLogin: boolean;
  selectedLocation: string;
  setSelectedLocation: React.Dispatch<React.SetStateAction<string>>;
  isFormComplete: boolean;
  emailLinked: boolean;
  onEmailLinkingChange: (status: boolean) => void;
}

const Step1: React.FC<Step1Props> = ({ isUsernameTaken, handleUsernameChange, handleImageChange, imagePreview, userEmail, isWalletLogin, selectedLocation, setSelectedLocation, isFormComplete, emailLinked, onEmailLinkingChange }) => {
  const { control, formState: { errors }, trigger, getValues, setValue } = useFormContext();
  const { linkEmail } = usePrivy();
  const [linkingEmail, setLinkingEmail] = useState(false);
  const [linkEmailError, setLinkEmailError] = useState<string | null>(null);

  const getLocationDisplayName = (locationString: string) => {
    try {
      const locationData = JSON.parse(locationString);
      return locationData.display_name || locationString;
    } catch (e) {
      return locationString;
    }
  };

  // Add onBlur handler to validate fields when user leaves input
  const handleBlur = async (fieldName: string) => {
    await trigger(fieldName);
  };

  useEffect(() => {
    // Set initial email linking state to false
    if (isWalletLogin && !userEmail) {
      onEmailLinkingChange(false);
    }
  }, [isWalletLogin, userEmail, onEmailLinkingChange]);

  const handleLinkEmail = async () => {
    setLinkingEmail(true);
    setLinkEmailError(null);
    const currentLocation = selectedLocation;
    
    try {
      await linkEmail();
      if (currentLocation) {
        setValue('location', currentLocation, { shouldValidate: false });
        setSelectedLocation(currentLocation);
      }
      onEmailLinkingChange(true);
    } catch (error) {
      setLinkEmailError('Failed to link email. Please try again.');
      onEmailLinkingChange(false);
    } finally {
      setLinkingEmail(false);
    }
  };

  // Add effect to update email linking state when userEmail changes
  useEffect(() => {
    if (userEmail) {
      onEmailLinkingChange(true);
    }
  }, [userEmail, onEmailLinkingChange]);

  // Modify the email section render logic
  const renderEmailSection = () => {
    if (!isWalletLogin || userEmail) {
      return (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormDescription>Your account email address</FormDescription>
          <FormControl>
            <Input
              value={userEmail || ''}
              className="text-lg p-6 bg-muted"
              disabled
            />
          </FormControl>
        </FormItem>
      );
    }

    if (!emailLinked) {
      return (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormDescription>
            Link an email address to secure your account and receive important updates
          </FormDescription>
          <FormControl>
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleLinkEmail}
                disabled={linkingEmail}
                variant="outline"
                className="w-[200px] h-[40px] text-sm font-medium"
              >
                {linkingEmail ? "Linking..." : "Link Email Address"}
              </Button>
              {linkEmailError && (
                <div className="text-destructive text-sm">{linkEmailError}</div>
              )}
            </div>
          </FormControl>
        </FormItem>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base sm:text-lg font-medium">
              Username <span className="text-destructive">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-muted-foreground mb-2">
              Choose a unique username that will identify you on the platform
            </FormDescription>
            <FormControl>
              <Input
                placeholder="satoshi"
                {...field}
                className={`text-base sm:text-lg p-6 rounded-xl transition-colors
                  ${errors.username ? 'border-destructive' : 'hover:border-primary focus:border-primary'}`}
                minLength={3}
                maxLength={50}
                onChange={handleUsernameChange}
                value={field.value || ''}
                required
              />
            </FormControl>
            {isUsernameTaken && (
              <p className="text-destructive text-sm mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Username is already taken
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base sm:text-lg">
              Full Name <span className="text-destructive">*</span>
            </FormLabel>
            <FormDescription className="text-sm sm:text-base">
              Enter your full name as you'd like it to appear on your profile
            </FormDescription>
            <FormControl>
              <Input
                placeholder="Satoshi Nakamoto"
                {...field}
                className="text-base sm:text-lg p-4 sm:p-6"
                maxLength={100}
                value={field.value || ''}
                required
                onBlur={() => handleBlur('fullName')}
              />
            </FormControl>
            <FormMessage>{typeof errors.fullName?.message === 'string' ? errors.fullName?.message : null}</FormMessage>
          </FormItem>
        )}
      />

      <Controller
        name="bio"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base sm:text-lg">
              Bio <span className="text-destructive">*</span>
            </FormLabel>
            <FormDescription className="text-sm sm:text-base">
              Tell us about yourself (maximum 500 characters)
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Share a brief introduction about yourself..."
                className="min-h-[100px] text-base sm:text-lg p-4 sm:p-6"
                maxLength={500}
                {...field}
                value={field.value || ''}
                required
                onBlur={() => handleBlur('bio')}
              />
            </FormControl>
            <FormMessage>{typeof errors.bio?.message === 'string' ? errors.bio?.message : null}</FormMessage>
          </FormItem>
        )}
      />

      <Controller
        name="location"
        control={control}
        rules={{ required: "Location is required" }}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="text-base sm:text-lg">
              Location <span className="text-destructive">*</span>
            </FormLabel>
            <FormDescription className="text-sm sm:text-base">
              Start typing to get location suggestions
            </FormDescription>
            <FormControl>
              <LocationInput 
                selectedLocation={field.value ? getLocationDisplayName(field.value) : ''}
                setSelectedLocation={setSelectedLocation}
                error={errors.location?.message?.toString()}
              />
            </FormControl>
            <FormMessage>{errors.location?.message?.toString()}</FormMessage>
          </FormItem>
        )}
      />

      {renderEmailSection()}

      <Controller
        name="profilePicture"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel className="text-base sm:text-lg font-medium">
              Profile Picture <span className="text-muted-foreground text-sm">(Optional)</span>
            </FormLabel>
            <FormDescription className="text-sm mb-2">
              Upload a profile picture (max 5MB, .jpg, .png, .webp)
            </FormDescription>
            <FormControl>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary">
                      <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 
                      file:text-sm file:font-semibold hover:file:bg-primary/80 cursor-pointer"
                    {...field}
                  />
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="text-sm text-muted-foreground mt-4">
        <span className="text-destructive">*</span> Required fields
      </div>
    </div>
  );
};

export default Step1;
