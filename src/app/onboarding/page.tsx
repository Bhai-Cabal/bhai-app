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

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      fullName: '',
      bio: '',
      profilePicture: undefined,
      email: '',
    },
    mode: 'onChange',
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      form.setValue('profilePicture', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = form.getValues();

    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userUUID = uuid();
      let profilePicturePath = null;

      const { error: userError } = await supabase.from('users').insert({
        id: userUUID,
        auth_id: user.id,
        username: values.username,
        full_name: values.fullName,
        bio: values.bio,
        email: values.email || user.email?.address,
        profile_completion_percentage: 20,
      });

      if (userError) throw userError;

      if (values.profilePicture) {
        const file = values.profilePicture;
        const { data, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(`public/${userUUID}/${file.name}`, file);

        if (uploadError) throw uploadError;
        profilePicturePath = data.path;

        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_picture_path: profilePicturePath })
          .eq('id', userUUID);

        if (updateError) throw updateError;
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
  const isWalletLogin = !userEmail;

  useEffect(() => {
    const subscription = form.watch(() => {
      form.trigger().then((isValid) => {
        setIsFormValid(isValid && !isUsernameTaken);
      });
    });

    return () => subscription.unsubscribe();
  }, [form, isUsernameTaken]);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={logout} className="absolute mt-4 ml-[36rem]">
          Logout
        </Button>
        <Card className="p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Welcome! Let's get started</h1>
            <p className="text-muted-foreground">
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
                isWalletLogin={isWalletLogin}
              />

              <div className="flex flex-col gap-4 items-center mt-8">
                <Button 
                  type="submit" 
                  disabled={isLoading || !isFormValid}
                  className="w-full max-w-sm"
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
                {!isFormValid && (
                  <p className="text-sm text-muted-foreground">
                    Please fill in all required fields correctly to continue
                  </p>
                )}
              </div>
            </form>
          </FormProvider>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
