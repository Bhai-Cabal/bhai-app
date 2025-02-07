"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UserCircle,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AccountDialog } from "./AccountDialog";
import { supabase } from "@/lib/supabase";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "User Directory",
    href: "/dashboard/user-directory",
    icon: Users,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardNav() {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const { user } = usePrivy();

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from("users")
          .select("profile_picture_path")
          .eq("auth_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile picture path:", error);
        } else if (data.profile_picture_path) {
          const { data: imageUrl } = await supabase
            .storage
            .from("profile-pictures")
            .getPublicUrl(data.profile_picture_path);

          if (!imageUrl) {
            console.error("Error fetching profile picture URL");
          } else {
            setProfilePictureUrl(imageUrl.publicUrl);
          }
        }
      }
    };

    fetchProfilePicture();
  }, [user?.id]);

  return (
    <div className="w-64 border-r bg-card min-h-screen p-4 flex flex-col justify-between fixed h-screen gap-4">
      <div className="space-y-6 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-4 px-4 text-xl font-bold text-primary">Dashboard</h2>
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200 hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "transparent"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setAccountDialogOpen(true)}
          className="w-full justify-start px-4 py-3 relative group"
        >
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="mr-3 h-8 w-8 rounded-full"
            />
          ) : (
            <UserCircle className="mr-3 h-8 w-8" />
          )}
          <span className="text-base font-medium">Account</span>
        </Button>
      </div>
      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
    </div>
  );
}