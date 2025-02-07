"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UserProfile {
  username: string;
  full_name: string;
  bio: string;
  location: string;
  birthday: string;
  crypto_entry_date: string;
  profile_completion_percentage: number;
}

export default function DashboardPage() {
  const { user } = usePrivy();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);
    }

    fetchProfile();
  }, [user?.id]);

  const handleUpdateProfile = () => {
    router.push("/dashboard/profile");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
          {profile ? (
            <div className="space-y-2">
              <p>
                <span className="font-medium">Name:</span> {profile.full_name}
              </p>
              <p>
                <span className="font-medium">Username:</span> @{profile.username}
              </p>
              <p>
                <span className="font-medium">Bio:</span> {profile.bio}
              </p>
              <p>
                <span className="font-medium">Location:</span> {profile.location}
              </p>
              <p>
                <span className="font-medium">Birthday:</span> {profile.birthday}
              </p>
              <p>
                <span className="font-medium">Crypto Entry Date:</span> {profile.crypto_entry_date}
              </p>
              <p>
                <span className="font-medium">Profile Completion:</span> {profile.profile_completion_percentage}%
              </p>
              <Button onClick={handleUpdateProfile}>Update Profile</Button>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-muted-foreground">No recent activity to show.</p>
        </Card>
      </div>
    </div>
  );
}