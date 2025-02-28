// components/Step1.tsx
import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { LocationInput } from '@/components/LocationInput';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';

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
  const { control, formState: { errors }, trigger } = useFormContext();
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

  const handleLinkEmail = async () => {
    setLinkingEmail(true);
    setLinkEmailError(null);
    try {
      await linkEmail();
      // Set email as linked after the process completes successfully
        onEmailLinkingChange(true);
      }
    } catch (error) {
      setLinkEmailError('Failed to link email. Please try again.');
      onEmailLinkingChange(false);
    } finally {
      setLinkingEmail(false);
    }
  };

  useEffect(() => {
    // Revalidate the form when the selectedLocation changes
    trigger();
  }, [selectedLocation, trigger]);

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
                className={`text-lg p-6 ${errors.username ? 'border-destructive' : ''}`}
                minLength={3}
                maxLength={50}
                onChange={handleUsernameChange}
                value={field.value || ''}
                required
                onBlur={() => handleBlur('username')}
              />
            </FormControl>
            {isUsernameTaken && <p className="text-red-500">Username is already taken</p>}
            <FormMessage>{typeof errors.username?.message === 'string' ? errors.username?.message : null}</FormMessage>
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
            <FormLabel>Location</FormLabel>
            <FormDescription>
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

      {isWalletLogin && (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormDescription>
            {emailLinked 
              ? "Email successfully linked!"
              : "Link an email address to secure your account and receive important updates"}
          </FormDescription>
          <FormControl>
            <div className="flex flex-col space-y-2">
              {emailLinked ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Email successfully linked</span>
                </div>
              ) : (
                <Button 
                  onClick={handleLinkEmail}
                  disabled={linkingEmail}
                  variant="outline"
                  className="w-[200px] h-[40px] text-sm font-medium transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                >
                  {linkingEmail ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Linking...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <span>Link Email Address</span>
                    </div>
                  )}
                </Button>
              )}
              {linkEmailError && (
                <div className="flex items-center space-x-2 text-destructive text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{linkEmailError}</span>
                </div>
              )}
            </div>
          </FormControl>
        </FormItem>
      )}

      {userEmail && !isWalletLogin && (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormDescription>Your account email address</FormDescription>
          <FormControl>
            <Input
              value={userEmail}
              className="text-lg p-6 bg-muted"
              disabled
            />
          </FormControl>
        </FormItem>
      )}

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
