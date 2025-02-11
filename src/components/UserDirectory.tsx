// components/UserDirectory.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog";

interface User {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  location: string;
  skills: Array<{ name: string }>;
  roles: Array<{ name: string }>;
  companies: Array<{ name: string, role: string }>;
  digital_identities: Array<{ platform: string, identifier: string }>;
  wallet_addresses: Array<{ blockchain: string, address: string }>;
  profile_picture_path?: string; // Add profile picture path
  profile_picture_url?: string; // Add profile picture URL
}

export function UserDirectory() {
  const { user } = usePrivy();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    skills: "",
    companies: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsers(user.id);   
    }
  }, [ filters, user]);

  const fetchUsers = async (userId: string) => {
    setIsLoading(true); // Start loader
    let query = supabase
      .from("users")
      .select(
        `*,
        user_companies (
          companies (
            id,
            name
          ),
          role
        ),
        digital_identities:digital_identities(platform, identifier),
        wallet_addresses:wallet_addresses(blockchain, address)
      `)
      // .neq('auth_id', userId); 

    if (filters.skills) {
      query = query.contains("skill_ids", `{${filters.skills}}`);
    }
    if (filters.companies) {
      query = query.ilike("user_companies.companies.name", `%${filters.companies}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      const usersWithDetails = await Promise.all(
        data.map(async (user) => {
          const { data: rolesData } = await supabase
            .from('roles')
            .select('id, name')
            .in('id', user.role_ids);

          const { data: skillsData } = await supabase
            .from('skills')
            .select('id, name')
            .in('id', user.skill_ids);

          let profilePictureUrl = null;
          if (user.profile_picture_path) {
            const { data: imageUrl } = await supabase
              .storage
              .from("profile-pictures")
              .getPublicUrl(user.profile_picture_path);

            profilePictureUrl = imageUrl.publicUrl;
          }

          return {
            ...user,
            roles: rolesData,
            skills: skillsData,
            profile_picture_url: profilePictureUrl,
          };
        })
      );

      setUsers(usersWithDetails);
    }
    setIsLoading(false); // Stop loader
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">User Directory</h2>

        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Input
            placeholder="Filter by skills"
            value={filters.skills}
            onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
          />
          <Input
            placeholder="Filter by companies"
            value={filters.companies}
            onChange={(e) => setFilters(prev => ({ ...prev, companies: e.target.value }))}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner loading-lg">
                Loading...
            </span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <Dialog key={user.id}>
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
                  <DialogClose className="p-2 absolute right-2 top-2">
                  </DialogClose>
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
                            <li key={skill.name}>{skill.name}</li>
                          ))
                        ) : (
                          <li>No skills added.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">Roles:</span>
                      <ul className="list-disc list-inside">
                        {user.roles?.length > 0 ? (
                          user.roles.map((role) => (
                            <li key={role.name}>{role.name}</li>
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
                          user.companies.map((company) => (
                            <li key={`${company.name}-${company.role}`}>
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
                          user.wallet_addresses.map((wallet) => (
                            <li key={wallet.address}>
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
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

