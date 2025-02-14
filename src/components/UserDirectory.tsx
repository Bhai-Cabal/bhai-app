import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { Search, X } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  location: string;
  skill_ids: string[];
  role_ids: string[];
  companies?: Array<{ name: string; role: string }>;
  digital_identities: Array<{ platform: string; identifier: string }>;
  wallet_addresses: Array<{ blockchain: string; address: string }>;
  profile_picture_url?: string;
  profile_picture_path?: string;
  skills?: Array<{ id: string; name: string }>;
  roles?: Array<{ id: string; name: string }>;
}

interface FilterState {
  companies: string[];
  skills: string[];
  roles: Array<{ id: string; name: string }>;
  searchTerm: string;
}

interface FilterItem {
  id: string;
  name: string;
}

interface MultiSelectProps {
  type: 'companies' | 'skills' | 'roles';
  items: FilterItem[];
  placeholder: string;
}

export function UserDirectory() {
  const { user } = usePrivy();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState<FilterItem[]>([]);
  const [availableSkills, setAvailableSkills] = useState<FilterItem[]>([]);
  const [availableRoles, setAvailableRoles] = useState<FilterItem[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    companies: [],
    skills: [],
    roles: [],
    searchTerm: ""
  });

  const [openPopover, setOpenPopover] = useState({
    companies: false,
    skills: false,
    roles: false
  });

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (user) fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters, user]);

  const fetchInitialData = async () => {
    try {
      const [companiesRes, skillsRes, rolesRes] = await Promise.all([
        supabase.from('companies').select('id, name').order('name'),
        supabase.from('skills').select('id, name').order('name'),
        supabase.from('roles').select('id, name').order('name')
      ]);

      setAvailableCompanies(companiesRes.data || []);
      setAvailableSkills(skillsRes.data || []);
      setAvailableRoles(rolesRes.data || []);

      // console.log(availableCompanies, availableSkills, availableRoles);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Start with a base query
      let query = supabase
        .from("users")
        .select(`
          id,
          username,
          full_name,
          bio,
          location,
          skill_ids,
          role_ids,
          profile_picture_path,
          user_companies!inner (
            company_id,
            companies!inner (
              id,
              name
            ),
            role
          ),
          digital_identities (platform, identifier),
          wallet_addresses (blockchain, address)
        `);

      // Apply filters
      if (filters.companies.length > 0) {
        query = query
          .in('user_companies.company_id', filters.companies);
      }

      if (filters.skills.length > 0) {
        query = query.overlaps('skill_ids', filters.skills);
      }

      if (filters.roles.length > 0) {
        const roleIds = filters.roles.map(role => role.id);
        query = query.overlaps('role_ids', roleIds);
      }

      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,username.ilike.%${filters.searchTerm}%,bio.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%`);
      }

      let { data: rawUsers, error } = await query;

      // If no companies filter is applied, get all users
      if (!filters.companies.length) {
        query = supabase
          .from("users")
          .select(`
            id,
            username,
            full_name,
            bio,
            location,
            skill_ids,
            role_ids,
            profile_picture_path,
            user_companies (
              company_id,
              companies (
                id,
                name
              ),
              role
            ),
            digital_identities (platform, identifier),
            wallet_addresses (blockchain, address)
          `);

        // Apply other filters
        if (filters.skills.length > 0) {
          query = query.overlaps('skill_ids', filters.skills);
        }
        if (filters.roles.length > 0) {
          const roleIds = filters.roles.map(role => role.id);
          query = query.overlaps('role_ids', roleIds);
        }
        if (filters.searchTerm) {
          query = query.or(`full_name.ilike.%${filters.searchTerm}%,username.ilike.%${filters.searchTerm}%,bio.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%`);
        }

        const result = await query;
        rawUsers = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (rawUsers) {
        const usersWithDetails = await Promise.all(
          rawUsers.map(async (user) => {
            const profilePicture = user.profile_picture_path
              ? await supabase.storage
                  .from("profile-pictures")
                  .getPublicUrl(user.profile_picture_path)
              : null;

            const [skills, roles] = await Promise.all([
              user.skill_ids?.length
                ? supabase
                    .from('skills')
                    .select('id, name')
                    .in('id', user.skill_ids)
                : { data: [] },
              user.role_ids?.length
                ? supabase
                    .from('roles')
                    .select('id, name')
                    .in('id', user.role_ids)
                : { data: [] }
            ]);

            return {
              ...user,
              skills: skills.data || [],
              roles: roles.data || [],
              companies: user.user_companies?.map(uc => ({
                name: uc.companies?.name || '',
                role: uc.role
              })) || [],
              profile_picture_url: profilePicture?.data.publicUrl
            };
          })
        );

        setUsers(usersWithDetails);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (
    type: 'companies' | 'skills' | 'roles',
    value: string | { id: string; name: string }
  ) => {
    setFilters(prev => {
      if (type === 'roles') {
        const roleValue = value as { id: string; name: string };
        const isSelected = prev.roles.some(role => role.id === roleValue.id);
        
        return {
          ...prev,
          roles: isSelected
            ? prev.roles.filter(role => role.id !== roleValue.id)
            : [...prev.roles, { id: roleValue.id, name: roleValue.name }]
        };
      }
      
      const stringValue = value as string;
      const isSelected = prev[type].includes(stringValue);
      
      return {
        ...prev,
        [type]: isSelected
          ? prev[type].filter(item => item !== stringValue)
          : [...prev[type], stringValue]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      companies: [],
      skills: [],
      roles: [],
      searchTerm: ""
    });
  };

  const MultiSelect = ({ type, items, placeholder }: MultiSelectProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="relative">
        <Select open={isOpen} onOpenChange={setIsOpen}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder}>
              {filters[type].length > 0 ? `${filters[type].length} selected` : placeholder}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-2">
              <Input
                placeholder={`Search ${type}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
            </div>
            <ScrollArea className="h-72">
              <div className="p-2">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No results found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => {
                      const isSelected = type === 'roles'
                        ? filters.roles.some(role => role.id === item.id)
                        : filters[type].includes(item.id);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (type === 'roles') {
                              toggleFilter(type, { id: item.id, name: item.name });
                            } else {
                              toggleFilter(type, item.id);
                            }
                          }}
                        >
                          <Checkbox
                            id={`${type}-${item.id}`}
                            checked={isSelected}
                            onCheckedChange={() => {
                              if (type === 'roles') {
                                toggleFilter(type, { id: item.id, name: item.name });
                              } else {
                                toggleFilter(type, item.id);
                              }
                            }}
                          />
                          <label
                            htmlFor={`${type}-${item.id}`}
                            className="flex-grow text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {item.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const UserCard = ({ user }: { user: User }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="p-4 cursor-pointer hover:bg-gray-100">
          <div className="flex items-start space-x-4">
            <Avatar>
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={user.full_name}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-medium">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="text-sm">{user.location}</p>
            </div>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="sr-only">User Details</DialogTitle>
        <DialogClose className="p-2 absolute right-2 top-2" />
        <div className="p-4 space-y-4">
          <h3 className="font-bold text-lg">{user.full_name}</h3>
          <p>
            <span className="font-medium">Bio:</span> {user.bio}
          </p>
          <p>
            <span className="font-medium">Location:</span> {user.location}
          </p>
          <div>
            <span className="font-medium">Skills:</span>
            <ul className="list-disc list-inside">
              {user.skills?.length > 0 ? (
                user.skills.map((skill) => (
                  <li key={skill.id}>{skill.name}</li>
                ))
              ) : (
                <li>No skills added.</li>
              )}
            </ul>
          </div>
          <div>
            <span className="font-medium">Roles:</span>
            <ul className="list-disc list-inside">
              {user.roles.length > 0 ? (
                user.roles?.map((role) => (
                  <li key={role.id}>{role.name}</li>
                ))
              ) : (
                <li>No roles added.</li>
              )}
            </ul>
          </div>
          <div>
            <span className="font-medium">Companies:</span>
            <ul className="list-disc list-inside">
              {user.companies?.length > 0 ? (
                user.companies.map((company, index) => (
                  <li key={index}>
                    {company.role} at {company.name}
                  </li>
                ))
              ) : (
                <li>No companies added.</li>
              )}
            </ul>
          </div>
          <div>
            <span className="font-medium">Wallet Addresses:</span>
            <ul className="list-disc list-inside">
              {user.wallet_addresses?.length > 0 ? (
                user.wallet_addresses.map((wallet, index) => (
                  <li key={index}>
                    {wallet.blockchain}: {wallet.address}
                  </li>
                ))
              ) : (
                <li>No wallet addresses added.</li>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">User Directory</h2>
          {(filters.companies.length > 0 || filters.skills.length > 0 || filters.roles.length > 0 || filters.searchTerm) && (
            <Button 
              variant="ghost"
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or bio..."
              className="pl-8"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MultiSelect 
              type="companies" 
              items={availableCompanies} 
              placeholder="Filter by companies" 
            />
            <MultiSelect 
              type="skills" 
              items={availableSkills} 
              placeholder="Filter by skills" 
            />
            <MultiSelect 
              type="roles" 
              items={availableRoles} 
              placeholder="Filter by roles" 
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.companies.map(id => {
              const company = availableCompanies.find(c => c.id === id);
              return company ? (
                <Badge 
                  key={`company-${id}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {company.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter('companies', id)}
                  />
                </Badge>
              ) : null;
            })}
            {filters.skills.map(id => {
              const skill = availableSkills.find(s => s.id === id);
              return skill ? (
                <Badge 
                  key={`skill-${id}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {skill.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter('skills', id)}
                  />
                </Badge>
              ) : null;
            })}
            {filters.roles.map(role => {
              const roleItem = availableRoles.find(r => r.id === role.id);
              return roleItem ? (
                <Badge 
                  key={`role-${role.id}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {roleItem.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter('roles', roleItem)}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner loading-lg">Loading...</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found matching your search criteria
          </div>
        )}
      </div>
    </Card>
  );
}