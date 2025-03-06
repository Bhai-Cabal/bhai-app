'use client'

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePrivy } from '@privy-io/react-auth';
import { checkUserRegistered, supabase } from '@/lib/supabase';
import { OnboardingFormValues, formSchema } from '@/types/form';
import Step1 from '@/components/onboarding/Step1';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { debounce } from 'lodash';
import { Header } from '@/components/layout/Header';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [emailLinked, setEmailLinked] = useState(false);
  
  // Modified handleEmailLinkingStatus
  const handleEmailLinkingStatus = (status: boolean) => {
    setEmailLinked(status);
    // Don't trigger validateForm here, let the useEffect handle it
  };

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      fullName: '',
      bio: '',
      location: '',
      email: '',
      profilePicture: undefined,
    },
    mode: 'onChange', // Enable real-time validation
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
    } else if (ready && authenticated && user?.id) {
      checkUserRegistered(user.id, user.email?.address ?? '').then((isRegistered) => {
        if (isRegistered) {
          router.push('/dashboard');
        }
      });
    }
  }, [ready, authenticated, user?.id]);

  const checkUsernameAvailability = debounce(async (username: string) => {
    const { data, error } = await supabase.from('users').select('username').eq('username', username);
    if (error) {
      console.error('Error checking username:', error);
    } else {
      setIsUsernameTaken(data.length > 0);
    }
  }, 300);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value;
    form.setValue('username', username);
    if (username.length >= 3) {
      checkUsernameAvailability(username);
    } else {
      setIsUsernameTaken(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        form.setError('profilePicture', {
          type: 'manual',
          message: 'File size must be less than 5MB',
        });
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        form.setError('profilePicture', {
          type: 'manual',
          message: 'File must be in JPG, PNG, or WebP format',
        });
        return;
      }

      await form.setValue('profilePicture', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Validate form after image is processed
        form.trigger();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = await form.trigger();
    
    if (!isValid || !isFormComplete) {
      const errors = form.formState.errors;
      if (Object.keys(errors).length > 0) {
        setError("Please fill in all required fields correctly.");
        return;
      }
      // Separate check for email linking
      if (isWalletLogin && !emailLinked) {
        setError("Please link your email address to continue.");
        return;
      }
      // Check location separately
      if (!selectedLocation) {
        setError("Please select a location.");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const values = form.getValues();
      const userUUID = uuid();
      let profilePicturePath: string | null = null; // Declare the variable here

      // First create user without profile picture
      const profileData = {
        id: userUUID,
        auth_id: user?.id ?? '',
        username: values.username,
        full_name: values.fullName,
        bio: values.bio,
        email: isWalletLogin ? values.email : userEmail,
        location: selectedLocation,
        profile_completion_percentage: 20,
      };

      const { error: userError } = await supabase.from('users').insert(profileData);

      if (userError) throw userError;

      // Handle profile picture upload if present
      if (values.profilePicture) {
        const file = values.profilePicture;
        const { data, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(`public/${userUUID}/${file.name}`, file);

        if (uploadError) throw uploadError;
        if (data) {
          profilePicturePath = data.path;

          // Update user with profile picture path
          const { error: updateError } = await supabase
            .from('users')
            .update({ profile_picture_path: profilePicturePath })
            .eq('id', userUUID);

          if (updateError) throw updateError;
        }
      }

      router.push('/dashboard/profile');
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const userEmail = user?.email?.address ?? null;
  const isWalletLogin = !userEmail && user?.wallet; // Check if user has a wallet but no email

  // Separate useEffect for form validation
  useEffect(() => {
    const validateFormFields = async () => {
      const values = form.getValues();
      const isValid = await form.trigger();

      const isComplete = !!(
        values.username &&
        values.fullName &&
        values.bio &&
        selectedLocation &&
        !isUsernameTaken &&
        isValid &&
        (!isWalletLogin || (isWalletLogin && emailLinked))
      );

      if (isComplete !== isFormComplete) {
        setIsFormComplete(isComplete);
      }
    };

    validateFormFields();
  }, [
    form,
    selectedLocation,
    isUsernameTaken,
    emailLinked,
    isWalletLogin,
    isFormComplete
  ]);

  // Modify location effect to not trigger validation
  useEffect(() => {
    if (selectedLocation) {
      form.setValue('location', selectedLocation, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [selectedLocation]);

  // Modify form watch effect
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Let the validation useEffect handle the form state
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    // Set email in form if user logged in with email
    if (userEmail && !isWalletLogin) {
      form.setValue('email', userEmail, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [userEmail, isWalletLogin]);

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={logout} />
      
      <main className="pt-[72px] pb-8 px-4">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="p-4 sm:p-8">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome! Let's get started</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Fill in your basic details to create your profile. You can complete the rest later.
              </p>
            </div>
            
            <FormProvider {...form}>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <Step1
                  isUsernameTaken={isUsernameTaken}
                  handleUsernameChange={handleUsernameChange}
                  handleImageChange={handleImageChange}
                  imagePreview={imagePreview}
                  userEmail={userEmail}
                  isWalletLogin={!!isWalletLogin}
                  selectedLocation={selectedLocation}
                  setSelectedLocation={setSelectedLocation}
                  isFormComplete={isFormComplete}
                  emailLinked={emailLinked}
                  onEmailLinkingChange={handleEmailLinkingStatus}
                />

                <div className="flex flex-col gap-3 items-center mt-8">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !isFormComplete}
                    className={`w-full sm:max-w-sm text-sm sm:text-base py-5 rounded-xl transition-all
                      ${!isFormComplete ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.02] hover:shadow-lg'}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Complete & Continue to Profile'
                    )}
                  </Button>

                  {!isFormComplete && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      Please fill in all required fields correctly to continue
                    </p>
                  )}

                  {error && (
                    <Alert variant="destructive" className="mt-2 w-full sm:max-w-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </form>
            </FormProvider>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OnboardingPage;
