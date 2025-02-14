import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { X } from 'lucide-react';
import { Role, Skill } from '@/types/form';
import { supabase } from '@/lib/supabase';

interface Step4Props {
  PLATFORMS: string[];
  roles: Role[];
  skills: Skill[];
  newPlatform: string;
  setNewPlatform: React.Dispatch<React.SetStateAction<string>>;
  handlePlatformChange: (index: number, selectedValue: string) => void;
  handleRoleChange: (index: number, selectedValue: string) => void;
  handleSkillInputChange: (value: string) => void;
  handleSkillSelect: (skill: Skill) => void;
  removeIdentity: (index: number) => void;
  removeRole: (index: number) => void;
  removeSkill: (skill: Skill) => void;
  addIdentity: () => void;
  addRole: () => void;
  skillInput: string;
  skillSuggestions: Skill[];
  selectedSkills: Skill[];
  identityWarning: string;
}

const ROLE_CATEGORIES = [
  'technical', 
  'product_design', 
  'business_operations', 
  'content_marketing',
  'investment_advisory',
  'trading_analytics'
];

const Step4: React.FC<Step4Props> = ({
  PLATFORMS,
  roles,
  skills,
  newPlatform,
  setNewPlatform,
  handlePlatformChange,
  handleRoleChange,
  handleSkillInputChange,
  handleSkillSelect,
  removeIdentity,
  removeRole,
  removeSkill,
  addIdentity,
  addRole,
  skillInput,
  skillSuggestions,
  selectedSkills,
  identityWarning,
}) => {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const [roleInput, setRoleInput] = useState('');
  const [newRoleDetails, setNewRoleDetails] = useState({ 
    name: '', 
    category: '', 
    description: '' 
  });
  const [newSkillDetails, setNewSkillDetails] = useState({ 
    name: '', 
    description: '' 
  });
  const [isAddingNewRole, setIsAddingNewRole] = useState(false);
  const [isAddingNewSkill, setIsAddingNewSkill] = useState(false);
  const [isRoleInputFocused, setIsRoleInputFocused] = useState(false);
  const [isSkillInputFocused, setIsSkillInputFocused] = useState(false);
  const [skillInputState, setSkillInputState] = useState(skillInput);
  const [skillValidationError, setSkillValidationError] = useState('');
  const [identityValidationError, setIdentityValidationError] = useState('');

  useEffect(() => {
    setSkillInputState(skillInput);
  }, [skillInput]);

  const selectedPlatforms = watch('digitalIdentities')
    .map((identity: { platform: string }) => identity.platform.toLowerCase());

  const availablePlatforms = PLATFORMS.filter(
    platform => !selectedPlatforms.includes(platform.toLowerCase())
  );

  const selectedRoles = watch('roles').map((role: { name: string }) => role.name.toLowerCase());
  const availableRoles = roles.filter(role => !selectedRoles.includes(role.name.toLowerCase()));

  const selectedSkillsNames = watch('skills').map((skill: { name: string }) => skill.name.toLowerCase());
  const availableSkills = skills.filter(skill => !selectedSkillsNames.includes(skill.name.toLowerCase()));

  const filteredRoles = availableRoles.filter(role => 
    role.name.toLowerCase().includes(roleInput.toLowerCase())
  );

  const findSimilarSkills = (skillName: string) => {
    const normalizedInput = skillName.toLowerCase().replace(/\s+/g, '');
    return skills.filter(skill => 
      skill.name.toLowerCase().replace(/\s+/g, '') === normalizedInput
    );
  };

  const handleNewRoleDetailsChange = (field: string, value: string) => {
    setNewRoleDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleNewSkillDetailsChange = (field: string, value: string) => {
    setNewSkillDetails(prev => ({ ...prev, [field]: value }));
    setSkillValidationError('');
  };

  const validateAndAddSkill = async () => {
    const similarSkills = findSimilarSkills(newSkillDetails.name);
    
    if (similarSkills.length > 0) {
      alert(`Similar skills exist: ${similarSkills.map(s => s.name).join(', ')}`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('skills')
        .insert([newSkillDetails])
        .select();

      if (error) throw error;

      if (data) {
        setValue('skills', [...watch('skills'), { name: newSkillDetails.name, id: data[0].id }]);
        setIsAddingNewSkill(false);
        setNewSkillDetails({ name: '', description: '' });
        setSkillValidationError('');
      }
    } catch (error) {
      console.error('Error creating new skill:', error);
    }
  };

  const handleNewRoleSubmit = async () => {
    if (!newRoleDetails.name || !newRoleDetails.category) {
      alert('Please provide a role name and select a category');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([newRoleDetails])
        .select();

      if (error) throw error;

      if (data) {
        setValue('roles', [...watch('roles'), { name: newRoleDetails.name, id: data[0].id }]);
        setIsAddingNewRole(false);
        setNewRoleDetails({ name: '', category: '', description: '' });
      }
    } catch (error) {
      console.error('Error creating new role:', error);
    }
  };

  const handleRemoveRole = (index: number) => {
    const updatedRoles = watch('roles').filter((_: any, i: number) => i !== index);
    setValue('roles', updatedRoles);
    removeRole(index);
  };

  const handleRemoveSkill = (skill: Skill) => {
    const updatedSkills = watch('skills').filter((s: Skill) => s.name !== skill.name);
    setValue('skills', updatedSkills);
    removeSkill(skill);
  };

  const filteredSkills = availableSkills.filter(skill => 
    skill.name.toLowerCase().includes(skillInputState.toLowerCase())
  );

  const checkDigitalIdentityExists = async (platform: string, identifier: string) => {
    try {
      const { data, error } = await supabase
        .from('digital_identities')
        .select('*')
        .eq('platform', platform.toLowerCase())
        .eq('identifier', identifier.toLowerCase());

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking digital identity:', error);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Digital Identities Section */}
      <div>
        <FormLabel>Digital Identities</FormLabel>
        <FormDescription>
          Add your social media and professional profiles.
        </FormDescription>
      </div>

      <div className="space-y-4">
        {watch('digitalIdentities').map((identity: { platform: string; identifier: string }, index: number) => (
          <div key={index} className="flex gap-4 items-start">
            <Controller
              name={`digitalIdentities.${index}.platform`}
              control={control}
              render={({ field }) => (
                <FormItem className="w-[200px]">
                  <FormControl>
                    <Select
                      onValueChange={(value: string) => handlePlatformChange(index, value)}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform">
                          {field.value ? field.value.charAt(0).toUpperCase() + field.value.slice(1) : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlatforms.map((platform: string) => (
                          <SelectItem key={platform} value={platform.toLowerCase()}>
                            {platform}
                          </SelectItem>
                        ))}
                        <div className="py-2">
                          <Input
                            placeholder="Add new platform"
                            value={newPlatform}
                            onChange={(e) => setNewPlatform(e.target.value)}
                            className="text-lg p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-black dark:border-gray-700 dark:text-white"
                          />
                        </div>
                        {newPlatform && (
                          <SelectItem key="new-platform" value={`new-${newPlatform}`}>
                            Add "{newPlatform}"
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>{(errors.digitalIdentities as any)?.[index]?.platform?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Controller
              name={`digitalIdentities.${index}.identifier`}
              control={control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Enter your profile link or identifier"
                      {...field}
                      className="text-lg p-3 dark:bg-black dark:border-gray-700 dark:text-white"
                      onChange={async (e) => {
                        field.onChange(e);
                        const platform = watch(`digitalIdentities.${index}.platform`);
                        if (platform && e.target.value) {
                          const exists = await checkDigitalIdentityExists(platform, e.target.value);
                          if (exists) {
                            setIdentityValidationError(`This ${platform} identity is already registered`);
                          } else {
                            setIdentityValidationError('');
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage>
                    {(errors.digitalIdentities as any)?.[index]?.identifier?.message}
                    {identityValidationError && (
                      <span className="text-red-500 text-sm">{identityValidationError}</span>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeIdentity(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          onClick={addIdentity}
          disabled={availablePlatforms.length === 0 && !newPlatform}
        >
          Add Digital Identity
        </Button>
        {identityWarning && (
          <div className="text-red-600 text-sm">
            {identityWarning}
          </div>
        )}
      </div>

      {/* Roles Section */}
      <div>
        <FormLabel>Roles</FormLabel>
        <FormDescription>
          Add your roles
        </FormDescription>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 role-input-container">
          <FormItem>
            <FormControl>
              <Input
                placeholder="Enter role"
                value={roleInput}
                className="text-lg p-3 dark:bg-black dark:border-gray-700 dark:text-white"
                onChange={(e) => setRoleInput(e.target.value)}
                onFocus={() => setIsRoleInputFocused(true)}
                onBlur={() => setTimeout(() => setIsRoleInputFocused(false), 200)}
              />
            </FormControl>
          </FormItem>
          {isRoleInputFocused && (
            <div className="bg-white border rounded shadow-md dark:bg-black dark:border-gray-700">
              {filteredRoles.map((role) => (
                <div
                  key={role.name}
                  className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                  onClick={() => {
                    const currentRoles = watch('roles');
                    setValue('roles', [...currentRoles, { name: role.name, id: role.id }]);
                    setRoleInput('');
                  }}
                >
                  {role.name}
                </div>
              ))}
              <div
                className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                onClick={() => setIsAddingNewRole(true)}
              >
                Other
              </div>
            </div>
          )}
        </div>

        {isAddingNewRole && (
          <div className="space-y-4 p-4 border rounded dark:bg-black dark:border-gray-700">
            <Input
              placeholder="Role Name"
              value={newRoleDetails.name}
              onChange={(e) => handleNewRoleDetailsChange('name', e.target.value)}
              className="text-lg p-3 dark:bg-black dark:border-gray-700 dark:text-white"
            />
            <Select
              value={newRoleDetails.category}
              onValueChange={(value) => handleNewRoleDetailsChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role Category" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Role Description (Optional)"
              value={newRoleDetails.description}
              onChange={(e) => handleNewRoleDetailsChange('description', e.target.value)}
              className="text-lg p-3 dark:bg-black dark:border-gray-700 dark:text-white"
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleNewRoleSubmit}
              >
                Save Role
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsAddingNewRole(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {watch('roles').map((role: any, index: number) => (
            <div key={role.name} className="flex items-center justify-between p-2 border rounded dark:bg-black dark:border-gray-700">
              <span>{role.name}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRole(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <FormLabel>Skills</FormLabel>
        <FormDescription>
          Add your skills
        </FormDescription>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 skill-input-container">
          <FormItem>
            <FormControl>
              <Input
                placeholder="Enter skill"
                value={skillInputState}
                className="text-lg p-3 dark:bg-black dark:border-gray-700 dark:text-white"
                onChange={(e) => setSkillInputState(e.target.value)}
                onFocus={() => setIsSkillInputFocused(true)}
                onBlur={() => setTimeout(() => setIsSkillInputFocused(false), 200)}
              />
            </FormControl>
          </FormItem>
          {isSkillInputFocused && (
            <div className="bg-white border rounded shadow-md dark:bg-black dark:border-gray-700">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                  onClick={() => {
                    const currentSkills = watch('skills');
                    setValue('skills', [...currentSkills, { name: skill.name, id: skill.id }]);
                    setSkillInputState('');
                  }}
                >
                  {skill.name}
                </div>
              ))}
              <div
                className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                onClick={() => setIsAddingNewSkill(true)}
              >
                Other
              </div>
            </div>
          )}
        </div>

        {isAddingNewSkill && (
          <div className="space-y-4 p-4 border rounded dark:bg-black dark:border-gray-700">
            <Input
              placeholder="Skill Name"
              value={newSkillDetails.name}
              onChange={(e) => handleNewSkillDetailsChange('name', e.target.value)}
              className="text-lg p-3 dark:bg-black dark:border-gray-700 dark:text-white"
            />
            <Input
              placeholder="Skill Description (Optional)"
              value={newSkillDetails.description}
              onChange={(e) => handleNewSkillDetailsChange('description', e.target.value)}
              className="text-lg p-3 dark:bg-black dark:border-gray-700 dark:text-white"
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={validateAndAddSkill}
              >
                Save Skill
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsAddingNewSkill(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {watch('skills').map((skill: any, index: number) => (
            <div key={skill.name} className="flex items-center justify-between p-2 border rounded dark:bg-black dark:border-gray-700">
              <span>{skill.name}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSkill(skill)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step4;