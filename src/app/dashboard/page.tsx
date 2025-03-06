"use client";

import { useState, useEffect, useMemo } from "react";
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
  Activity,
  Loader2,
  Globe2,
  LayoutDashboard
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
import Web3NetworkViz from "@/components/Web3NetworkViz";
import { parseLocation } from '@/lib/locationParser';
import { motion } from "framer-motion";

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalRoles: number;
  yourConnections: number;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  location: string;
  profile_completion_percentage: number;
  current_tier: string;
  bq_score: number;
  crypto_entry_date: string;
  avatarUrl: string;
  profile_picture_path?: string;
  skill_ids?: string | string[];
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  users: number;
  profiles: {
    id: string;
    avatarUrl: string;
    full_name: string;
    title?: string;
  }[];
}

interface DeveloperProfile {
  id: string;
  avatarUrl: string;
  profile_picture_path?: string;
  full_name: string;
  title?: string;
  location: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  skills: string[];
}

// Add interface for trend data
interface TrendData {
  date: string;
  connections: number;
  messages: number;
}

const formatLocation = (locationString: string) => {
  try {
    const locationObj = JSON.parse(locationString);
    return locationObj.display_name || 'Unknown location';
  } catch (e) {
    return locationString;
  }
};

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
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);

  // Fetch all data in a single request when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    }
  }, [user?.id]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. First fetch user profile (we need the user ID to fetch other data)
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select(`
          id,
          username,
          full_name,
          bio,
          location,
          profile_completion_percentage,
          current_tier,
          bq_score,
          crypto_entry_date,
          profile_picture_path,
          skill_ids
        `)
        .eq("auth_id", user?.id)
        .single();

      if (profileError) throw profileError;

      // Process profile picture if exists
      let avatarUrl = '';
      if (profileData.profile_picture_path) {
        const { data: imageUrl } = await supabase
          .storage
          .from("profile-pictures")
          .getPublicUrl(profileData.profile_picture_path);
        avatarUrl = imageUrl?.publicUrl || '';
      }

      const processedProfile: UserProfile = {
        ...profileData,
        avatarUrl
      };
      
      setProfile(processedProfile);

      // 2. Now fetch dashboard stats and users in parallel
      const [usersPromise, statsPromise] = await Promise.all([
        // Fetch all users for the network visualization
        supabase
          .from("users")
          .select(`
            id,
            full_name,
            location,
            profile_picture_path,
            skill_ids
          `)
          .not('location', 'is', null),
        
        // Fetch dashboard stats
        Promise.all([
          supabase.from("users").select("*", { count: "exact" }),
          supabase.from("companies").select("*", { count: "exact" }),
          supabase.from("roles").select("*", { count: "exact" }),
          supabase.from("user_companies")
            .select("*", { count: "exact" })
            .eq("user_id", processedProfile.id)
        ])
      ]);

      // Process users data
      const { data: users, error: usersError } = usersPromise;
      if (usersError) throw usersError;

      // Process stats data
      const [
        { count: usersCount },
        { count: companiesCount },
        { count: rolesCount },
        { count: connectionsCount }
      ] = statsPromise;

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalRoles: rolesCount || 0,
        yourConnections: connectionsCount || 0
      });

      // Process users for visualization
      if (users && users.length > 0) {
        // Map users to developer profiles
        const devProfiles = users.map(user => {
          const parsedLocation = parseLocation(user.location);
          
          // Parse skills from skill_ids
          let skills: string[] = ['Web3', 'Blockchain']; // Default skills
          if (user.skill_ids) {
            if (Array.isArray(user.skill_ids)) {
              skills = user.skill_ids;
            } else if (typeof user.skill_ids === 'string') {
              try {
                const parsed = JSON.parse(user.skill_ids);
                if (Array.isArray(parsed)) {
                  skills = parsed;
                }
              } catch (e) {
                console.error("Error parsing skills:", e);
              }
            }
          }
          
          return {
            id: user.id,
            avatarUrl: '', // Will be set in the next step
            profile_picture_path: user.profile_picture_path,
            full_name: user.full_name,
            title: "user.title",
            location: {
              lat: parsedLocation.lat,
              lng: parsedLocation.lng,
              city: parsedLocation.city,
              country: parsedLocation.country
            },
            skills
          };
        });

        // Get profile picture URLs for all developers in a single batch
        const developersWithAvatars = await Promise.all(
          devProfiles.map(async (dev) => {
            if (dev.profile_picture_path) {
              const { data: imageUrl } = await supabase
                .storage
                .from("profile-pictures")
                .getPublicUrl(dev.profile_picture_path);

              return {
                ...dev,
                avatarUrl: imageUrl?.publicUrl || ''
              };
            }
            return dev;
          })
        );

        setDevelopers(developersWithAvatars);
      }

      // 3. Fetch activities data (optional - could be done later)
      // This is mocked for now, but in a real app, you'd fetch this from the backend
      setActivities([
        // {
        //   id: '1',
        //   type: 'connection',
        //   description: 'New connection request from Jane Doe',
        //   timestamp: new Date().toLocaleString()
        // },
        // {
        //   id: '2',
        //   type: 'message',
        //   description: 'Message received from Acme Corp',
        //   timestamp: new Date(Date.now() - 86400000).toLocaleString()
        // }
      ]);

      // 4. Fetch trend data (optional - could be done later)
      // This is mocked for now, but in a real app, you'd fetch this from the backend
      setTrendData([
        { date: 'Jan', connections: 10, messages: 5 },
        { date: 'Feb', connections: 15, messages: 10 },
        { date: 'Mar', connections: 25, messages: 18 },
        { date: 'Apr', connections: 30, messages: 22 }
      ]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize the avatar URL to prevent unnecessary re-renders
  const profileAvatarUrl = useMemo(() => profile?.avatarUrl || '', [profile?.avatarUrl]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Loading your dashboard...</p>
          <p className="text-sm text-muted-foreground">Fetching latest data</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[2000px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Tabs defaultValue="map" className="h-full flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 w-full md:w-auto"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <Avatar className="h-14 w-14 ring-2 ring-background relative">
                  <AvatarImage src={profileAvatarUrl} />
                  <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}</h1>
                <p className="text-sm text-muted-foreground">Here's what's happening in your network</p>
              </div>
            </motion.div>
            
            <motion.div className="w-full md:w-auto">
              <div className="overflow-auto scrollbar-none -mx-2 px-2">
                <TabsList className="w-[500px] md:w-auto h-12 sm:h-14 p-1 sm:p-1.5 bg-background/80 backdrop-blur-xl border rounded-xl sm:rounded-2xl inline-flex whitespace-nowrap">
                  {[
                    { value: "map", icon: Globe2, label: "Network" },
                    { value: "overview", icon: LayoutDashboard, label: "Overview" },
                    { value: "analytics", icon: TrendingUp, label: "Analytics" },
                    { value: "activity", icon: Activity, label: "Activity" }
                  ].map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="relative px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-xl transition-all duration-300 hover:bg-primary/5 min-w-[120px] flex-shrink-0"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </motion.div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </motion.div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-h-0">
            <TabsContent 
              value="map" 
              className="h-[calc(100vh-16rem)] sm:h-[70vh] md:h-[80vh] overflow-hidden rounded-xl border bg-card"
            >
              <div className="h-full relative">
                <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-lg border max-w-[200px] sm:max-w-none">
                  <h3 className="text-sm font-medium mb-1 truncate">Global Network</h3>
                  <p className="text-xs text-muted-foreground">
                    {developers.length} members across {new Set(developers.map(d => d.location.country)).size} countries
                  </p>
                </div>
                <Web3NetworkViz 
                  developers={developers}
                  showResetButton={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6">
                {/* Profile Card */}
                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileAvatarUrl} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
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
                          <p className="text-muted-foreground">
                            {profile?.location ? formatLocation(profile.location) : 'No location set'}
                          </p>
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

            <TabsContent value="activity" className="space-y-6">
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
                  {activities.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>

      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
    </div>
  );
}