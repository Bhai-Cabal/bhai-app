// pages/onboarding/index.tsx

"use client";

import { usePrivy } from "@privy-io/react-auth";
import { v4 as uuid } from 'uuid';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
import { OnboardingFormValues, formSchema } from "@/types/form";

// Import step components
import BasicInfoStep from "@/components/onboarding/BasicInfoStep";
import LocationStep from "@/components/onboarding/LocationStep";
import ProfessionalStep from "@/components/onboarding/ProfessionalStep";
import DigitalIdentityStep from "@/components/onboarding/DigitalIdentityStep";
import WalletStep from "@/components/onboarding/WalletStep";
import CompanyStep from "@/components/onboarding/CompanyStep";

const MAX_STEPS = 6;

export default function OnboardingPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      fullName: "",
      location: "",
      birthday: "",
      cryptoEntryDate: new Date().toISOString().split("T")[0],
      primaryRole: "",
      skills: [],
      digitalIdentities: [],
      walletAddresses: [],
      companies: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    }
  }, [ready, authenticated, router]);

  const nextStep = async () => {
    const fieldsToValidate = {
      1: ["username", "fullName"],
      2: ["location", "birthday", "cryptoEntryDate"],
      3: ["primaryRole", "skills"],
      4: ["digitalIdentities"],
      5: ["walletAddresses"],
      6: ["companies"],
    }[currentStep];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, MAX_STEPS));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  async function onSubmit(values: OnboardingFormValues) {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
  
    try {
      const userUUID = uuid();

      // 1. Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userUUID,
          auth_id: user.id,
          username: values.username,
          full_name: values.fullName,
          location: values.location,
          birthday: values.birthday,
          crypto_entry_date: values.cryptoEntryDate,
          profile_completion_percentage: 100,
        });

      if (userError) throw userError;

      // 2. Handle profile picture upload
      if (values.profilePicture) {
        const fileExt = values.profilePicture.name.split('.').pop();
        const fileName = `${userUUID}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, values.profilePicture);

        if (uploadError) throw uploadError;

        await supabase
          .from('users')
          .update({ profile_picture_path: fileName })
          .eq('id', userUUID);
      }

      // 3. Handle primary role
      if (values.primaryRole) {
        // First, get or create the role
        const { data: existingRole, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', values.primaryRole)
          .single();

        let roleId;
        if (roleError) {
          // Role doesn't exist, create it
          const { data: newRole, error: createRoleError } = await supabase
            .from('roles')
            .insert({ name: values.primaryRole })
            .select()
            .single();

          if (createRoleError) throw createRoleError;
          roleId = newRole.id;
        } else {
          roleId = existingRole.id;
        }

        // Create user-role association
        const { error: userRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userUUID,
            role_id: roleId,
            is_primary: true
          });

        if (userRoleError) throw userRoleError;
      }

      // 4. Handle skills
      if (values.skills.length > 0) {
        for (const skill of values.skills) {
          // First, get or create the skill
          const { data: existingSkill, error: skillCheckError } = await supabase
            .from('skills')
            .select('id')
            .eq('name', skill.name)
            .single();

          let skillId;
          if (skillCheckError) {
            // Skill doesn't exist, create it
            const { data: newSkill, error: createSkillError } = await supabase
              .from('skills')
              .insert({ name: skill.name })
              .select()
              .single();

            if (createSkillError) throw createSkillError;
            skillId = newSkill.id;
          } else {
            skillId = existingSkill.id;
          }

          // Create user-skill association
          const { error: userSkillError } = await supabase
            .from('user_skills')
            .insert({
              user_id: userUUID,
              skill_id: skillId,
              proficiency_level: skill.proficiencyLevel
            });

          if (userSkillError) throw userSkillError;
        }
      }

      // 5. Handle digital identities
      if (values.digitalIdentities.length > 0) {
        const digitalIdentitiesData = values.digitalIdentities.map(identity => ({
          user_id: userUUID,
          platform: identity.platform,
          identifier: identity.identifier,
          verified: false
        }));

        const { error: identitiesError } = await supabase
          .from('digital_identities')
          .insert(digitalIdentitiesData);

        if (identitiesError) throw identitiesError;
      }

      // 6. Handle wallet addresses
      if (values.walletAddresses.length > 0) {
        const walletAddressesData = values.walletAddresses.map(wallet => ({
          user_id: userUUID,
          blockchain: wallet.blockchain,
          address: wallet.address,
          verified: false
        }));

        const { error: walletsError } = await supabase
          .from('wallet_addresses')
          .insert(walletAddressesData);

        if (walletsError) throw walletsError;
      }

      // 7. Handle companies
      if (values.companies.length > 0) {
        for (const company of values.companies) {
          // First, get or create company
          const { data: existingCompany, error: companyCheckError } = await supabase
            .from('companies')
            .select('id')
            .eq('name', company.name)
            .single();

          let companyId;
          if (companyCheckError) {
            const { data: newCompany, error: createCompanyError } = await supabase
              .from('companies')
              .insert({
                name: company.name,
                website: company.website
              })
              .select()
              .single();

            if (createCompanyError) throw createCompanyError;
            companyId = newCompany.id;
          } else {
            companyId = existingCompany.id;
          }

          // Create user-company association
          const { error: userCompanyError } = await supabase
            .from('user_companies')
            .insert({
              user_id: userUUID,
              company_id: companyId,
              role: company.role,
              start_date: company.startDate,
              end_date: company.endDate,
              is_current: company.isCurrent
            });

          if (userCompanyError) throw userCompanyError;
        }
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: MAX_STEPS }).map((_, index) => (
                <div
                  key={index}
                  className={`w-1/6 h-2 rounded-full mx-1 ${
                    index + 1 <= currentStep ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="text-center text-sm text-gray-500">
              Step {currentStep} of {MAX_STEPS}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && <BasicInfoStep form={form} />}
              {currentStep === 2 && <LocationStep form={form} />}
              {currentStep === 3 && <ProfessionalStep form={form} />}
              {currentStep === 4 && <DigitalIdentityStep form={form} />}
              {currentStep === 5 && <WalletStep form={form} />}
              {currentStep === 6 && <CompanyStep form={form} />}

              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    className="w-[150px]"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < MAX_STEPS ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className={`w-[150px] ${currentStep === 1 ? 'ml-auto' : ''}`}
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="w-[150px]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Complete"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}