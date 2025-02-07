// src/hooks/useOnboardingForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OnboardingFormValues, formSchema } from "@/types/form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { v4 as uuid } from 'uuid';

export const useOnboardingForm = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      fullName: "",
      bio: "",
      profilePicture: undefined,
      location: "",
      birthday: "",
      cryptoEntryDate: new Date().toISOString().split("T")[0],
      companies: [],
      digitalIdentities: [],
      walletAddresses: [],
      roles: [],
      skills: []
    },
    mode: "onChange",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        form.setError("profilePicture", {
          type: "manual",
          message: "File size must be less than 5MB"
        });
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        form.setError("profilePicture", {
          type: "manual",
          message: "File must be in JPG, PNG, or WebP format"
        });
        return;
      }
 
      form.setValue("profilePicture", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: OnboardingFormValues) => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const userUUID = uuid();
      let profilePicturePath = null;

      if (values.profilePicture) {
        const file = values.profilePicture;
        const { data, error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(`public/${userUUID}/${file.name}`, file);

        if (uploadError) throw uploadError;
        profilePicturePath = data.path;
      }

      // Calculate profile completion percentage
      let completionPercentage = 0;
      if (values.username) completionPercentage += 20;
      if (values.fullName) completionPercentage += 20;
      if (values.bio) completionPercentage += 20;
      if (values.location) completionPercentage += 20;
      if (values.birthday) completionPercentage += 20;

      // Create user record
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: userUUID,
          auth_id: userId,
          username: values.username,
          full_name: values.fullName,
          bio: values.bio,
          profile_picture_path: profilePicturePath,
          location: values.location,
          birthday: values.birthday,
          crypto_entry_date: values.cryptoEntryDate,
          profile_completion_percentage: completionPercentage,
        });

      if (userError) throw userError;

      // Insert related data
      await Promise.all([
        // Insert companies
        ...values.companies.map(async (company) => {
          const { data, error } = await supabase.from("companies").insert({
            name: company.name,
            website: company.website,
          }).select();
          if (error) throw error;
          return supabase.from("user_companies").insert({
            user_id: userUUID,
            company_id: data[0].id,
            role: company.role,
            start_date: company.startDate,
            end_date: company.endDate,
            is_current: company.isCurrent
          });
        }),
        // Insert digital identities
        ...values.digitalIdentities.map((identity) => 
          supabase.from("digital_identities").insert({
            user_id: userUUID,
            platform: identity.platform,
            identifier: identity.identifier,
          })
        ),
        // Insert wallet addresses
        ...values.walletAddresses.map((wallet) => 
          supabase.from("wallet_addresses").insert({
            user_id: userUUID,
            blockchain: wallet.blockchain,
            address: wallet.address,
          })
        ),
      ]);

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    error,
    imagePreview,
    handleImageChange,
    handleSubmit,
  };
};