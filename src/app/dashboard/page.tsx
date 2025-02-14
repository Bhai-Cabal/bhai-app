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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  avatarUrl: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trendData, setTrendData] = useState([]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={() => setAccountDialogOpen(true)}>
          <UserCircle className="mr-2 h-4 w-4" /> Update Profile
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatarUrl || ''} />
                <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                <p className="text-muted-foreground">{profile?.bio}</p>
                <div className="flex space-x-4">
                  <div>
                    <p className="text-sm font-medium">Member since</p>
                    <p className="text-muted-foreground">{profile?.crypto_entry_date}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-muted-foreground">{profile?.location}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card className="p-4 bg-secondary">
                <p className="text-sm font-medium">Profile Completion</p>
                <Progress value={profile?.profile_completion_percentage} className="my-2" />
                <p className="text-xs text-muted-foreground">{profile?.profile_completion_percentage}% Complete</p>
              </Card>
              
              <Card className="p-4 bg-secondary">
                <p className="text-sm font-medium">BQ Score</p>
                <h3 className="text-2xl font-bold mt-2">{profile?.bq_score}</h3>
                <p className="text-xs text-muted-foreground">Top {(profile?.bq_score ?? 0) > 80 ? '20%' : '50%'}</p>
              </Card>

              <Card className="p-4 bg-secondary">
                <p className="text-sm font-medium">Current Tier</p>
                <h3 className="text-2xl font-bold mt-2 capitalize">{profile?.current_tier}</h3>
                <p className="text-xs text-muted-foreground">3 days to next tier</p>
              </Card>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Total Members</h3>
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Engagement Trends</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="connections" stroke="#8884d8" />
                  <Line type="monotone" dataKey="messages" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Skills</h3>
              {/* Add skills chart/list here */}
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Industry Focus</h3>
              {/* Add industry distribution chart here */}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-secondary">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
    </div>
  );
}