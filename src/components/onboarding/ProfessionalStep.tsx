// components/onboarding/ProfessionalStep.tsx

import { UseFormReturn } from "react-hook-form";
import { OnboardingFormValues } from "@/types/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ProfessionalStepProps {
  form: UseFormReturn<OnboardingFormValues>;
}

const PROFESSIONAL_CATEGORIES = {
  "Technical Roles": [
    { id: "smart_contract_developer", label: "Smart Contract Developer" },
    { id: "frontend_developer", label: "Frontend Developer" },
    { id: "full_stack_developer", label: "Full Stack Developer" },
    { id: "protocol_engineer", label: "Protocol Engineer" },
    { id: "security_engineer", label: "Security Engineer/Auditor" },
    { id: "zkproof_engineer", label: "zkProof Engineer" },
    { id: "research_engineer", label: "Research Engineer" },
    { id: "infrastructure_engineer", label: "Infrastructure Engineer" },
    { id: "technical_writer", label: "Technical Writer" },
  ],
  "Product & Design": [
    { id: "product_manager", label: "Product Manager" },
    { id: "product_designer", label: "Product Designer" },
    { id: "ux_researcher", label: "UX Researcher" },
    { id: "technical_product_manager", label: "Technical Product Manager" },
  ],
  "Business & Operations": [
    { id: "founder", label: "Founder/Co-founder" },
    { id: "business_development", label: "Business Development" },
    { id: "operations_manager", label: "Operations Manager" },
    { id: "treasury_manager", label: "Treasury Manager" },
    { id: "tokenomics_designer", label: "Token Economics Designer" },
    { id: "community_manager", label: "Community Manager" },
    { id: "developer_relations", label: "Developer Relations" },
    { id: "growth_manager", label: "Growth Manager" },
    { id: "partnership_manager", label: "Partnership Manager" },
  ],
  "Content & Marketing": [
    { id: "content_creator", label: "Content Creator" },
    { id: "technical_content_writer", label: "Technical Content Writer" },
    { id: "community_content_manager", label: "Community Content Manager" },
    { id: "social_media_manager", label: "Social Media Manager" },
    { id: "marketing_manager", label: "Marketing Manager" },
    { id: "brand_manager", label: "Brand Manager" },
  ],
  "Investment & Advisory": [
    { id: "venture_capitalist", label: "Venture Capitalist" },
    { id: "angel_investor", label: "Angel Investor" },
    { id: "protocol_researcher", label: "Protocol Researcher" },
    { id: "tokenomics_advisor", label: "Tokenomics Advisor" },
    { id: "governance_specialist", label: "Governance Specialist" },
    { id: "mev_researcher", label: "MEV Researcher" },
    { id: "defi_strategist", label: "DeFi Strategist" },
  ],
  "Trading & Analytics": [
    { id: "quant_trader", label: "Quant Trader" },
    { id: "onchain_analyst", label: "On-chain Analyst" },
    { id: "data_scientist", label: "Data Scientist" },
    { id: "market_maker", label: "Market Maker" },
    { id: "trading_strategy_developer", label: "Trading Strategy Developer" },
  ],
};

const SKILL_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Elementary" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Expert" },
];

export default function ProfessionalStep({ form }: ProfessionalStepProps) {
  const addSkill = () => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", [
      ...currentSkills,
      { name: "", proficiencyLevel: 1 },
    ]);
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skills");
    form.setValue(
      "skills",
      currentSkills.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="primaryRole"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Role</FormLabel>
            <FormDescription>
              Select your main role in the crypto/web3 space
            </FormDescription>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="text-lg p-6">
                  <SelectValue placeholder="Select your primary role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px]">
                {Object.entries(PROFESSIONAL_CATEGORIES).map(([category, roles]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-sm font-semibold bg-muted">
                      {category}
                    </div>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* <FormField
        control={form.control}
        name="experienceYears"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Years of Experience</FormLabel>
            <FormDescription>
              How many years of experience do you have in this role?
            </FormDescription>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                max="50"
                step="0.5"
                className="text-lg p-6"
                {...field}
                value={field.value as string | number | readonly string[] | undefined}
                onChange={e => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      /> */}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <FormLabel>Skills</FormLabel>
            <FormDescription>
              Add relevant skills for your role
            </FormDescription>
          </div>
          <Button type="button" variant="outline" onClick={addSkill}>
            Add Skill
          </Button>
        </div>

        {form.watch("skills").map((_, index) => (
          <div key={index} className="flex gap-4 items-start">
            <FormField
              control={form.control}
              name={`skills.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input 
                      placeholder="Skill name" 
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
              name={`skills.${index}.proficiencyLevel`}
              render={({ field }) => (
                <FormItem className="w-[200px]">
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SKILL_LEVELS.map((level) => (
                        <SelectItem 
                          key={level.value} 
                          value={level.value.toString()}
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSkill(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}