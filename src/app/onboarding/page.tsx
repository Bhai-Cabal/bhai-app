'use client'
// pages/onboarding.tsx
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { usePrivy } from '@privy-io/react-auth';
import { checkUserRegistered, supabase } from '@/lib/supabase';
import { OnboardingFormValues, Role, Skill, formSchema } from '@/types/form';
import Step1 from '@/components/onboarding/Step1';
import Step2 from '@/components/onboarding/Step2';
import Step3 from '@/components/onboarding/Step3';
import Step4 from '@/components/onboarding/Step4';
import Step5 from '@/components/onboarding/Step5';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { debounce } from 'lodash';
import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const MAX_STEPS = 5;

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newPlatform, setNewPlatform] = useState('');
  const [newBlockchain, setNewBlockchain] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCategory, setNewRoleCategory] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [walletWarning, setWalletWarning] = useState<string | null>(null);
  const [identityWarning, setIdentityWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchRolesAndSkills = async () => {
      const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
      const { data: skillsData, error: skillsError } = await supabase.from('skills').select('*');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      } else {
        setRoles(rolesData);
      }

      if (skillsError) {
        console.error('Error fetching skills:', skillsError);
      } else {
        setSkills(skillsData);
      }
    };

    fetchRolesAndSkills();
  }, []);

  const PLATFORMS = ['Twitter', 'GitHub', 'LinkedIn', 'Discord', 'Telegram', 'Medium'];
  const BLOCKCHAINS = ['Ethereum', 'Polygon', 'Solana', 'Bitcoin', 'Arbitrum', 'Optimism'];

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      fullName: '',
      bio: '',
      profilePicture: undefined,
      location: '',
      birthday: '',
      cryptoEntryDate: new Date().toISOString().split('T')[0],
      companies: [],
      digitalIdentities: [],
      walletAddresses: [],
      roles: [],
      skills: [],
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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = form.getValues();

    const walletAddresses = form.getValues('walletAddresses');
    const hasEthereum = walletAddresses.some(wallet => wallet.blockchain.toLowerCase() === 'ethereum');
    const hasSolana = walletAddresses.some(wallet => wallet.blockchain.toLowerCase() === 'solana');
    if (!hasEthereum || !hasSolana) {
      setWalletWarning('Ethereum and Solana wallet addresses are mandatory.');
      return;
    } else {
      setWalletWarning(null);
    }

    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userUUID = uuid();
      let profilePicturePath = null;
      // Save user data first
      const { error: userError } = await supabase.from('users').insert({
        id: userUUID,
        auth_id: user.id,
        username: values.username,
        full_name: values.fullName,
        bio: values.bio,
        email: user.email?.address,
        location: selectedLocation,
        birthday: values.birthday,
        crypto_entry_date: values.cryptoEntryDate,
        profile_completion_percentage: 0, // Will be updated later
        role_ids: values.roles.map((role) => role.id),
        skill_ids: values.skills.map((skill) => skill.id), // Add skill ids to the form data
      });

      if (userError) throw userError;

      // Upload profile picture if provided
      if (values.profilePicture) {
        const file = values.profilePicture;
        const { data, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(`public/${userUUID}/${file.name}`, file);

        if (uploadError) throw uploadError;
        profilePicturePath = data.path;

        // Update user record with profile picture path
        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_picture_path: profilePicturePath })
          .eq('id', userUUID);

        if (updateError) throw updateError;
      }

      // Calculate profile completion percentage
      let completionPercentage = 0;
      if (values.username) completionPercentage += 20;
      if (values.fullName) completionPercentage += 20;
      if (values.bio) completionPercentage += 20;
      if (selectedLocation) completionPercentage += 20;
      if (values.birthday) completionPercentage += 20;

      // Update user record with completion percentage
      const { error: completionError } = await supabase
        .from('users')
        .update({ profile_completion_percentage: completionPercentage })
        .eq('id', userUUID);

      if (completionError) throw completionError;

      // Insert data into related tables
      await Promise.all([
        ...values.companies.map(async (company) => {
          // Ensure start_date is before end_date
          if (company.endDate && new Date(company.startDate) > new Date(company.endDate)) {
            throw new Error('Start date must be before end date');
          }
          return supabase.from('user_companies').insert({
            user_id: userUUID,
            company_id: company.companyId,
            role: company.role,
            start_date: company.startDate || null,
            end_date: company.endDate || null,
            is_current: company.isCurrent,
          });
        }),
        ...values.digitalIdentities.map((identity) =>
          supabase.from('digital_identities').insert({
            user_id: userUUID,
            platform: identity.platform,
            identifier: identity.identifier,
          })
        ),
        ...values.walletAddresses.map((wallet) =>
          supabase.from('wallet_addresses').insert({
            user_id: userUUID,
            blockchain: wallet.blockchain,
            address: wallet.address,
          })
        ),
      ]);

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepFields: { [key: number]: string[] } = {
    1: ['username', 'fullName', 'bio'],
    2: ['location','birthday', 'cryptoEntryDate'],
    3: ['companies'],
    4: ['digitalIdentities', 'roles', 'skills'],
    5: ['walletAddresses'],
  };

  const handleNextStep = async () => {
    const fieldsToValidate = stepFields[currentStep];
    const isValid = await form.trigger(fieldsToValidate as (keyof OnboardingFormValues)[]);

    if (currentStep === 4) {
      const digitalIdentities = form.getValues('digitalIdentities');
      const hasTwitter = digitalIdentities.some(identity => identity.platform.toLowerCase() === 'twitter');
      const hasTelegram = digitalIdentities.some(identity => identity.platform.toLowerCase() === 'telegram');
      if (!hasTwitter || !hasTelegram) {
        setIdentityWarning('Twitter and Telegram accounts are mandatory.');
        return;
      } else {
        setIdentityWarning(null);
      }
    }

    if (currentStep === 5) {
      const walletAddresses = form.getValues('walletAddresses');
      const hasEthereum = walletAddresses.some(wallet => wallet.blockchain.toLowerCase() === 'ethereum');
      const hasSolana = walletAddresses.some(wallet => wallet.blockchain.toLowerCase() === 'solana');
      if (!hasEthereum && !hasSolana) {
        setWalletWarning('Ethereum and Solana wallet addresses are mandatory.');
        return;
      } else {
        setWalletWarning(null);
      }
    }

    if (isValid && currentStep < MAX_STEPS) {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        form.setError('profilePicture', {
          type: 'manual',
          message: 'File size must be less than 5MB',
        });
        return;
      }

      // Validate file type
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

  const addCompany = () => {
    const currentCompanies = form.getValues('companies');
    form.setValue('companies', [
      ...currentCompanies,
      {
        name: '',
        website: '',
        role: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
      },
    ]);
  };

  const removeCompany = (index: number) => {
    const currentCompanies = form.getValues('companies');
    form.setValue(
      'companies',
      currentCompanies.filter((_, i) => i !== index)
    );
  };

  const addIdentity = () => {
    const currentIdentities = form.getValues('digitalIdentities');
    form.setValue('digitalIdentities', [
      ...currentIdentities,
      { platform: '', identifier: '' },
    ]);
  };

  const removeIdentity = (index: number) => {
    const currentIdentities = form.getValues('digitalIdentities');
    form.setValue(
      'digitalIdentities',
      currentIdentities.filter((_, i) => i !== index)
    );
  };

  const handlePlatformChange = async (index: number, selectedValue: string) => {
    form.setValue(`digitalIdentities.${index}.platform`, selectedValue);

    // If it's a new platform, add it to the PLATFORMS array
    if (selectedValue.startsWith('new-')) {
      const newPlatformName = selectedValue.replace('new-', '');
      PLATFORMS.push(newPlatformName);
      setNewPlatform(''); // Clear the input
    }
  };

  const addWallet = () => {
    const currentWallets = form.getValues('walletAddresses');
    form.setValue('walletAddresses', [
      ...currentWallets,
      { blockchain: '', address: '' },
    ]);
  };

  const removeWallet = (index: number) => {
    const currentWallets = form.getValues('walletAddresses');
    form.setValue(
      'walletAddresses',
      currentWallets.filter((_, i) => i !== index)
    );
  };

  const handleBlockchainChange = async (index: number, selectedValue: string) => {
    form.setValue(`walletAddresses.${index}.blockchain`, selectedValue);

    // If it's a new blockchain, add it to the BLOCKCHAINS array
    if (selectedValue.startsWith('new-')) {
      const newBlockchainName = selectedValue.replace('new-', '');
      BLOCKCHAINS.push(newBlockchainName);
      setNewBlockchain(''); // Clear the input
    }
  };

  const addRole = () => {
    const currentRoles = form.getValues('roles');
    form.setValue('roles', [...currentRoles, { id: '', name: '' }]);
  };

  const removeRole = (index: number) => {
    const currentRoles = form.getValues('roles');
    form.setValue('roles', currentRoles.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    const currentSkills = form.getValues('skills');
    form.setValue('skills', [...currentSkills, { id: '', name: '' }]);
  };

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

  const handleRoleChange = async (index: number, selectedValue: string) => {
    const selectedRole = roles.find((role) => role.name === selectedValue);
    if (selectedRole) {
      form.setValue(`roles.${index}`, selectedRole);
    }

    // If it's a new role, add it to the roles array
    if (selectedValue.startsWith('new-')) {
      const newRoleName = selectedValue.replace('new-', '');
      const { data, error } = await supabase.from('roles').insert({ name: newRoleName, category: 'technical' }).select();
      if (error) {
        console.error('Error adding new role:', error);
      } else {
        setRoles([...roles, data[0]]);
        form.setValue(`roles.${index}`, data[0]);
      }
    }
  };

  const handleAddNewRole = async () => {
    const { data, error } = await supabase.from('roles').insert({
      name: newRoleName,
      category: newRoleCategory,
      description: newRoleDescription,
    }).select();

    if (error) {
      console.error('Error adding new role:', error);
    } else {
      setRoles([...roles, data[0]]);
      setNewRoleName('');
      setNewRoleCategory('');
      setNewRoleDescription('');
      setIsRoleDialogOpen(false);
    }
  };

  const handleAddNewSkill = async () => {
    const { data, error } = await supabase.from('skills').insert({
      name: newSkillName,
      description: newSkillDescription,
    }).select();

    if (error) {
      console.error('Error adding new skill:', error);
    } else {
      setSkills([...skills, data[0]]);
      setNewSkillName('');
      setNewSkillDescription('');
      setIsSkillDialogOpen(false);
    }
  };

  const handlePlaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    if (inputValue.length > 2) {
      fetchLocationSuggestions(inputValue);
    } else {
      setLocationSuggestions([]);
    }
  };

  const fetchLocationSuggestions = async (input: string) => {
    const service = new google.maps.places.AutocompleteService();
    const request = {
      input,
      // componentRestrictions: { country: 'us' }, // Optional country restriction
    };

    service.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setLocationSuggestions(predictions);
      } else {
        setLocationSuggestions([]);
      }
    });
  };

  const handleSuggestionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    const placeId = prediction.place_id;

    const request = {
      placeId,
      fields: ['name', 'formatted_address', 'geometry'],
    };

    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        if (place && place.formatted_address) {
          setSelectedLocation(place.formatted_address);
          form.setValue('location', place.formatted_address);
        }
      }
    });

    setLocationSuggestions([]);
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const handleSkillInputChange = (value: string) => {
    setSkillInput(value);
    fetchSkillSuggestions(value);
  };

  const handleSkillSelect = (skill: Skill) => {
    if (!selectedSkills.some((s) => s.name === skill.name)) {
      setSelectedSkills([...selectedSkills, skill]);
      setSkillSuggestions([]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: Skill) => {
    setSelectedSkills(selectedSkills.filter((s) => s.name !== skill.name));
  };

  const fetchSkillSuggestions = async (input: string) => {
    if (input.length > 2) {
      const { data, error } = await supabase
        .from('skills')
        .select('id, name')
        .ilike('name', `%${input}%`);
      if (error) {
        console.error('Error fetching skill suggestions:', error);
      } else {
        setSkillSuggestions(data);
      }
    } else {
      setSkillSuggestions([]);
    }
  };

  const handleClickOutside = () => {
    setSkillSuggestions([]);
    setSkillInput('');
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.skill-input-container')) {
        handleClickOutside();
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1
            isUsernameTaken={isUsernameTaken}
            handleUsernameChange={handleUsernameChange}
            handleImageChange={handleImageChange}
            imagePreview={imagePreview}
          />
        );
      case 2:
        return (
          <Step2
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            getMaxDate={getMaxDate}
            getMinDate={getMinDate}
          />
        );
      case 3:
        return <Step3 addCompany={addCompany} removeCompany={removeCompany} />;
      case 4:
        return (
          <>
            <Step4
              PLATFORMS={PLATFORMS}
              roles={roles}
              skills={skills}
              newPlatform={newPlatform}
              setNewPlatform={setNewPlatform}
              handlePlatformChange={handlePlatformChange}
              handleRoleChange={handleRoleChange}
              handleSkillInputChange={handleSkillInputChange}
              handleSkillSelect={handleSkillSelect}
              removeIdentity={removeIdentity}
              removeRole={removeRole}
              removeSkill={removeSkill}
              addIdentity={addIdentity}
              addRole={addRole}
              skillInput={skillInput}
              skillSuggestions={skillSuggestions}
              selectedSkills={selectedSkills} 
              identityWarning={identityWarning ? 'Twitter and Telegram accounts are mandatory.' : ''} />
            
          </>
        );
      case 5:
        return (
          <Step5
            BLOCKCHAINS={BLOCKCHAINS}
            newBlockchain={newBlockchain}
            setNewBlockchain={setNewBlockchain}
            handleBlockchainChange={handleBlockchainChange}
            removeWallet={removeWallet}
            addWallet={addWallet}
            walletWarning={walletWarning ? 'Ethereum and Solana wallet addresses are mandatory.' : ''}
          />
        );
      default:
        return null;
    }
  };

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
          
          <FormProvider {...form}>
            <form onSubmit={handleFormSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
              {renderStepContent()}

              <div className="flex justify-between">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    Previous
                  </Button>
                )}
                {currentStep < MAX_STEPS ? (
                  <Button type="button" onClick={handleNextStep}>
                    Next
                  </Button>
                ) : (
                  <> </>
                )}
                {currentStep === 5 && (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Complete'
                    )}
                  </Button>
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
