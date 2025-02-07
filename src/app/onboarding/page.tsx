"use client";

import { usePrivy } from "@privy-io/react-auth";
import { v4 as uuid } from 'uuid';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
import { OnboardingFormValues, formSchema } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { checkUserRegistered } from "@/lib/supabase";
import { Select, SelectContent, SelectTrigger, SelectValue, components, SelectItem } from "@/components/ui/select";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const MAX_STEPS = 5;

const ROLES = [
  { value: "technical", label: "Technical" },
  { value: "product_design", label: "Product Design" },
  { value: "business_operations", label: "Business Operations" },
  { value: "content_marketing", label: "Content Marketing" },
  { value: "investment_advisory", label: "Investment Advisory" },
  { value: "trading_analytics", label: "Trading & Analytics" },
];

const SKILLS = [
  { value: "solidity", label: "Solidity" },
  { value: "react", label: "React" },
  { value: "nodejs", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
];

export default function OnboardingPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newPlatform, setNewPlatform] = useState('');
  const [newBlockchain, setNewBlockchain] = useState('');
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCategory, setNewRoleCategory] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');

  useEffect(() => {
    const fetchRolesAndSkills = async () => {
      const { data: rolesData, error: rolesError } = await supabase.from("roles").select("*");
      const { data: skillsData, error: skillsError } = await supabase.from("skills").select("*");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      } else {
        setRoles(rolesData);
      }

      if (skillsError) {
        console.error("Error fetching skills:", skillsError);
      } else {
        setSkills(skillsData);
      }
    };

    fetchRolesAndSkills();
  }, []);

  const PLATFORMS = [
    "Twitter",
    "GitHub",
    "LinkedIn",
    "Discord",
    "Telegram",
    "Medium",
  ];

  const BLOCKCHAINS = [
    "Ethereum",
    "Polygon",
    "Solana",
    "Bitcoin",
    "Arbitrum",
    "Optimism",
  ];

  // Sample list of locations
  const LOCATIONS = [
    { value: "New York, United States", label: "New York, United States" },
    { value: "London, United Kingdom", label: "London, United Kingdom" },
    { value: "Tokyo, Japan", label: "Tokyo, Japan" },
    { value: "Paris, France", label: "Paris, France" },
    { value: "Singapore", label: "Singapore" },
    { value: "Hong Kong", label: "Hong Kong" },
    { value: "Dubai, United Arab Emirates", label: "Dubai, United Arab Emirates" },
    { value: "Berlin, Germany", label: "Berlin, Germany" },
    { value: "Toronto, Canada", label: "Toronto, Canada" },
    { value: "Sydney, Australia", label: "Sydney, Australia" },
    { value: "Seoul, South Korea", label: "Seoul, South Korea" },
    { value: "Mumbai, India", label: "Mumbai, India" },
    { value: "São Paulo, Brazil", label: "São Paulo, Brazil" },
    { value: "Amsterdam, Netherlands", label: "Amsterdam, Netherlands" },
    { value: "Stockholm, Sweden", label: "Stockholm, Sweden" },
    { value: "Zürich, Switzerland", label: "Zürich, Switzerland" },
    { value: "Tel Aviv, Israel", label: "Tel Aviv, Israel" },
    { value: "Shanghai, China", label: "Shanghai, China" },
    { value: "San Francisco, United States", label: "San Francisco, United States" },
    { value: "Miami, United States", label: "Miami, United States" },
  ];

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

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login");
    } else if (ready && authenticated && user?.id) {
      checkUserRegistered(user.id).then((isRegistered) => {
        if (isRegistered) {
          router.push("/dashboard");
        }
      });
    }
  }, [ready, authenticated, user?.id, router]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = form.getValues();

    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userUUID = uuid();
      let profilePicturePath = null;

      // Upload profile picture if provided
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
          auth_id: user.id,
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

      // Insert data into related tables
      await Promise.all([
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
        ...values.digitalIdentities.map((identity) => 
          supabase.from("digital_identities").insert({
            user_id: userUUID,
            platform: identity.platform,
            identifier: identity.identifier,
          })
        ),
        ...values.walletAddresses.map((wallet) => 
          supabase.from("wallet_addresses").insert({
            user_id: userUUID,
            blockchain: wallet.blockchain,
            address: wallet.address, 
          })
        ),
        ...values.roles.map(async (role) => {
          const { data, error } = await supabase
            .from("roles")
            .select("id")
            .eq("name", role.value);
          if (error) throw error;
          if (data.length > 0) {
            return supabase.from("user_roles").insert({
              user_id: userUUID,
              role_id: data[0].id,
            });
          } else {
            const { data: newRoleData, error: newRoleError } = await supabase
              .from("roles")
              .insert({ name: role.value })
              .select();
            if (newRoleError) throw newRoleError;
            return supabase.from("user_roles").insert({
              user_id: userUUID,
              role_id: newRoleData[0].id,
            });
          }
        }),
        ...values.skills.map(async (skill) => {
          const { data, error } = await supabase
            .from("skills")
            .select("id")
            .eq("name", skill.value);
          if (error) throw error;
          if (data.length > 0) {
            return supabase.from("user_skills").insert({
              user_id: userUUID,
              skill_id: data[0].id,
              proficiency_level: 3, // You can adjust the default proficiency level here
            });
          } else {
            const { data: newSkillData, error: newSkillError } = await supabase
              .from("skills")
              .insert({ name: skill.value })
              .select();
            if (newSkillError) throw newSkillError;
            return supabase.from("user_skills").insert({
              user_id: userUUID,
              skill_id: newSkillData[0].id,
              proficiency_level: 3, // You can adjust the default proficiency level here
            });
          }
        }),
      ]);

      router.push("/dashboard"); 
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < MAX_STEPS) {
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
        form.setError("profilePicture", {
          type: "manual",
          message: "File size must be less than 5MB"
        });
        return;
      }

      // Validate file type
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

  const addCompany = () => {
    const currentCompanies = form.getValues("companies");
    form.setValue("companies", [
      ...currentCompanies,
      {
        name: "",
        website: "",
        role: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
      },
    ]);
  };

  const removeCompany = (index: number) => {
    const currentCompanies = form.getValues("companies");
    form.setValue(
      "companies",
      currentCompanies.filter((_, i) => i !== index)
    );
  };

  const addIdentity = () => {
    const currentIdentities = form.getValues("digitalIdentities");
    form.setValue("digitalIdentities", [
      ...currentIdentities,
      { platform: "", identifier: "" },
    ]);
  };

  const removeIdentity = (index: number) => {
    const currentIdentities = form.getValues("digitalIdentities");
    form.setValue(
      "digitalIdentities",
      currentIdentities.filter((_, i) => i !== index)
    );
  };

  const handlePlatformChange = async (
    index: number,
    selectedValue: string
  ) => {
    form.setValue(`digitalIdentities.${index}.platform`, selectedValue);

    // If it's a new platform, add it to the PLATFORMS array
    if (selectedValue.startsWith("new-")) {
      const newPlatformName = selectedValue.replace("new-", "");
      PLATFORMS.push(newPlatformName);
      setNewPlatform(""); // Clear the input
    }
  };
  
  const addWallet = () => {
    const currentWallets = form.getValues("walletAddresses");
    form.setValue("walletAddresses", [
      ...currentWallets,
      { blockchain: "", address: "" },
    ]);
  };

  const removeWallet = (index: number) => {
    const currentWallets = form.getValues("walletAddresses");
    form.setValue(
      "walletAddresses",
      currentWallets.filter((_, i) => i !== index)
    );
  };

  const handleBlockchainChange = async (
    index: number,
    selectedValue: string
  ) => {
    form.setValue(`walletAddresses.${index}.blockchain`, selectedValue);

    // If it's a new blockchain, add it to the BLOCKCHAINS array
    if (selectedValue.startsWith("new-")) {
      const newBlockchainName = selectedValue.replace("new-", "");
      BLOCKCHAINS.push(newBlockchainName); 
      setNewBlockchain(''); // Clear the input
    }
  };

  const addRole = () => {
    const currentRoles = form.getValues("roles");
    form.setValue("roles", [...currentRoles, { value: "", label: "" }]);
  };

  const removeRole = (index: number) => {
    const currentRoles = form.getValues("roles");
    form.setValue("roles", currentRoles.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", [...currentSkills, { value: "", label: "" }]);
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter((_, i) => i !== index));
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
    form.setValue(`roles.${index}.value`, selectedValue);

    // If it's a new role, add it to the roles array
    if (selectedValue.startsWith("new-")) {
      const newRoleName = selectedValue.replace("new-", "");
      const { data, error } = await supabase.from("roles").insert({ name: newRoleName, category: "technical" }).select();
      if (error) {
        console.error("Error adding new role:", error);
      } else {
        setRoles([...roles, data[0]]);
        setNewRole(""); // Clear the input
      }
    }
  };

  const handleAddNewRole = async () => {
    const { data, error } = await supabase.from("roles").insert({
      name: newRoleName,
      category: newRoleCategory,
      description: newRoleDescription,
    }).select();

    if (error) {
      console.error("Error adding new role:", error);
    } else {
      setRoles([...roles, data[0]]);
      setNewRoleName('');
      setNewRoleCategory('');
      setNewRoleDescription('');
      setIsRoleDialogOpen(false);
    }
  };

  const handleAddNewSkill = async () => {
    const { data, error } = await supabase.from("skills").insert({
      name: newSkillName,
      description: newSkillDescription,
    }).select();

    if (error) {
      console.error("Error adding new skill:", error);
    } else {
      setSkills([...skills, data[0]]);
      setNewSkillName('');
      setNewSkillDescription('');
      setIsSkillDialogOpen(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormDescription>
                    Choose a unique username that will identify you on the
                    platform (minimum 3 characters)
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

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormDescription>
                    Enter your full name as you'd like it to appear on your
                    profile
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

            <FormField
              control={form.control}
              name="bio"
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
                      value={
                        typeof field.value === 'string' ? field.value : ''
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Location</FormLabel>
                  <FormDescription>
                    Where are you based? Select your city and country
                  </FormDescription>
                  <FormControl>
                    <Select
                      options={LOCATIONS}
                      onChange={(selectedOption: { value: any; }) =>
                        form.setValue(
                          "location",
                          selectedOption?.value || ''
                        )
                      }
                      className="text-lg p-6"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthday</FormLabel>
                  <FormDescription>
                    Your date of birth (must be at least 13 years old)
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      max={getMaxDate()}
                      min={getMinDate()}
                      className="text-lg p-6"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cryptoEntryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crypto Entry Date</FormLabel>
                  <FormDescription>
                    When did you first get involved in crypto/web3?
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      max={new Date().toISOString().split('T')[0]}
                      min="2009-01-03" // Bitcoin genesis block date
                      className="text-lg p-6"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <FormLabel>Work Experience</FormLabel>
              <FormDescription>
                Add your current and previous work experience
              </FormDescription>
            </div>

            <div className="space-y-8">
              {form.watch('companies').map((company, index) => (
                <div
                  key={index}
                  className="space-y-4 p-4 border rounded-lg relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => removeCompany(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <FormField
                    control={form.control}
                    name={`companies.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg p-6" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`companies.${index}.website`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            {...field}
                            className="text-lg p-6"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`companies.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg p-6" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`companies.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="text-lg p-6"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!company.isCurrent && (
                      <FormField
                        control={form.control}
                        name={`companies.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="text-lg p-6"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`companies.${index}.isCurrent`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I currently work here</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addCompany}>
                Add Company
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <FormLabel>Digital Identities</FormLabel>
              <FormDescription>
                Add your social media and professional profiles
              </FormDescription>
            </div>

            <div className="space-y-4">
              {form.watch('digitalIdentities').map((identity, index) => (
                <div key={index} className="flex gap-4 items-start">
                  {/* Platform Select */}
                  <FormField
                    control={form.control}
                    name={`digitalIdentities.${index}.platform`}
                    render={({ field }) => (
                      <FormItem className="w-[200px]">
                        <Select
                          onValueChange={(value) => handlePlatformChange(index, value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORMS.map((platform) => (
                              <SelectItem key={platform} value={platform.toLowerCase()}>
                                {platform}
                              </SelectItem>
                            ))}
                            {/* Input for adding a new platform */}
                            <div className="py-2">
                              <Input
                                placeholder="Add new platform"
                                value={newPlatform}
                                onChange={(e) => setNewPlatform(e.target.value)}
                                className="text-lg p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            {newPlatform && (
                              <SelectItem key="new-platform" value={`new-${newPlatform}`}>
                                Add "{newPlatform}"
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`digitalIdentities.${index}.identifier`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Enter your profile link or identifier"
                            {...field}
                            className="text-lg p-3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeIdentity(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addIdentity}>
                Add Digital Identity
              </Button>
            </div>

            <div>
              <FormLabel>Roles</FormLabel>
              <FormDescription>
                Add your roles
              </FormDescription>
            </div>

            <div className="space-y-4">
              {form.watch('roles').map((_, index) => (
                <div key={index} className="flex gap-4 items-start">
                  {/* Role Select */}
                  <FormField
                    control={form.control}
                    name={`roles.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="w-[200px]">
                        <Select
                          onValueChange={(value) => handleRoleChange(index, value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
                              </SelectItem>
                            ))}
                            <SelectItem key="new-role" value="new-role">
                              Add New Role
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRole(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRole}>
                Add Role
              </Button>
            </div>

            <div>
              <FormLabel>Skills</FormLabel>
              <FormDescription>
                Add your skills
              </FormDescription>
            </div>

            <div className="space-y-4">
              {form.watch('skills').map((_, index) => (
                <div key={index} className="flex gap-4 items-start">
                  {/* Skill Select */}
                  <FormField
                    control={form.control}
                    name={`skills.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="w-[200px]">
                        <Select
                          onValueChange={(value) => form.setValue(`skills.${index}.value`, value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select skill" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skills.map((skill) => (
                              <SelectItem key={skill.id} value={skill.name}>
                                {skill.name}
                              </SelectItem>
                            ))}
                            <SelectItem key="new-skill" value="new-skill">
                              Add New Skill
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSkill}>
                Add Skill
              </Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <FormLabel>Wallet Addresses</FormLabel>
              <FormDescription>
                Add your blockchain wallet addresses
              </FormDescription>
            </div>

            <div className="space-y-4">
              {form.watch('walletAddresses').map((wallet, index) => (
                <div key={index} className="flex gap-4 items-start">
                  {/* Blockchain Select */}
                  <FormField
                    control={form.control}
                    name={`walletAddresses.${index}.blockchain`}
                    render={({ field }) => (
                      <FormItem className="w-[200px]">
                        <Select
                          onValueChange={(value) => handleBlockchainChange(index, value)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blockchain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BLOCKCHAINS.map((blockchain) => (
                              <SelectItem key={blockchain} value={blockchain.toLowerCase()}>
                                {blockchain}
                              </SelectItem>
                            ))}
                            {/* Input for adding a new blockchain */}
                            <div className="py-2">
                              <Input
                                placeholder="Add new blockchain"
                                value={newBlockchain}
                                onChange={(e) => setNewBlockchain(e.target.value)}
                                className="text-lg p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            {newBlockchain && (
                              <SelectItem key="new-blockchain" value={`new-${newBlockchain}`}>
                                Add "{newBlockchain}"
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`walletAddresses.${index}.address`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Enter your wallet address"
                            {...field}
                            className="text-lg p-3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeWallet(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addWallet}>
                Add Wallet Address
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {renderStepContent()}

              <div className="flex justify-between">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
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
                {
                  currentStep === 5 && (
                    <Button type="submit" disabled={isLoading} >
                    {isLoading ? (
                      <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                      </>
                    ) : (
                      'Complete'
                    )}
                    </Button>
                  )
                }
              </div>
            </form>
          </Form>
        </Card>
      </div>

      {/* Dialog for adding new role */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Role Name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="text-lg p-3"
            />
            <Select
              onValueChange={(value) => setNewRoleCategory(value)}
              value={newRoleCategory}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {["technical", "product_design", "business_operations", "content_marketing", "investment_advisory", "trading_analytics"].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Role Description"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              className="text-lg p-3"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewRole}>
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding new skill */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Skill Name"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="text-lg p-3"
            />
            <Textarea
              placeholder="Skill Description"
              value={newSkillDescription}
              onChange={(e) => setNewSkillDescription(e.target.value)}
              className="text-lg p-3"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSkillDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewSkill}>
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

