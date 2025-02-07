"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserCircle, 
  Users, 
  Building2, 
  Briefcase,
  ChevronRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { AccountDialog } from "@/components/AccountDialog";
import { supabase } from "@/lib/supabase";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalRoles: number;
  yourConnections: number;
}

interface UserProfile {
  username: string;
  full_name: string;
  bio: string;
  location: string;
  profile_completion_percentage: number;
  current_tier: string;
  bq_score: number;
  crypto_entry_date: string;
}

export default function DashboardPage() {
  const { user } = usePrivy();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalRoles: 0,
    yourConnections: 0
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch dashboard stats
      const [
        { count: usersCount },
        { count: companiesCount },
        { count: rolesCount },
        { count: connectionsCount }
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact" }),
        supabase.from("companies").select("*", { count: "exact" }),
        supabase.from("roles").select("*", { count: "exact" }),
        supabase.from("user_companies")
          .select("*", { count: "exact" })
          .eq("user_id", profileData.id)
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalRoles: rolesCount || 0,
        yourConnections: connectionsCount || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
      </div>

      {/* Dashboard Content */}
      <div className="grid gap-6">
        {/* Profile Overview */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold">Profile Overview</h2>
              <p className="text-sm text-muted-foreground">
                Complete your profile to unlock more features
              </p>
            </div>
            <Button variant="outline" onClick={() => setAccountDialogOpen(true)}>
              Update Profile
            </Button>
          </div>

          {profile && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Profile Completion</p>
                  <Progress 
                    value={profile.profile_completion_percentage} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {profile.profile_completion_percentage}% Complete
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Tier</p>
                  <p className="text-2xl font-bold capitalize">
                    {profile.current_tier}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">BQ Score</p>
                  <p className="text-2xl font-bold">{profile.bq_score}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Total Users</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalUsers}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Companies</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalCompanies}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Available Roles</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.totalRoles}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Your Connections</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.yourConnections}</p>
          </Card>
        </div>

       
      </div>

      {/* Account Dialog */}
      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
    </div>
  );
}