"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UserCircle,
  Settings,
  Users,
  Briefcase,
  ChevronLeft,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { AccountDialog } from "./AccountDialog";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardNavProps {
  onCollapse?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  className?: string;
}

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
    title: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
  // {
  //   title: "Settings",
  //   href: "/dashboard/settings",
  //   icon: Settings,
  // },
];

export function DashboardNav({ onCollapse, defaultCollapsed = false, className }: DashboardNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    // Add event listener for profile picture updates
    const handleProfilePictureUpdate = (event: CustomEvent<{ url: string }>) => {
      setProfilePictureUrl(event.detail.url);
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    // Initialize with default collapsed state
    onCollapse?.(defaultCollapsed);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsCollapsed(true);
        onCollapse?.(true);
      }
    }

    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed, onCollapse]);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onCollapse?.(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <nav className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 text-xs",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop Nav */}
      <div 
        ref={navRef}
        className={cn(
          "relative border-r border-border/40 bg-card/80 backdrop-blur-md min-h-screen flex flex-col justify-between fixed h-screen transition-all duration-300 ease-in-out z-50",
          isCollapsed ? "w-20" : "w-72",
          className
        )}
      >
        {/* Top section */}
        <div className="space-y-6 flex-1 p-6">
          {/* Logo and collapse button */}
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent"
                >
                  <Link href="/" className="flex flex-row gap-2 text-nowrap">
                    <img className="w-8 h-8 rounded-xl border" src="/bhai-cabal.jpg" ></img>
                    Bhai Cabal
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-8 h-8 rounded-full transition-all duration-300 hover:bg-accent/50",
                isCollapsed && "rotate-180 ml-auto"
              )}
              onClick={handleCollapse}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation items */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  "hover:bg-accent/50 hover:text-accent-foreground hover:translate-x-1",
                  pathname === item.href
                    ? "bg-accent/50 text-accent-foreground shadow-sm"
                    : "text-muted-foreground",
                  isCollapsed ? "justify-center px-2" : "px-4"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={cn("flex items-center", isCollapsed ? "justify-center" : "")}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed ? "mr-0" : "mr-3")} />
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom section - Fixed to bottom */}
        <div className="w-full absolute bottom-0 p-6 border-t bg-background/80 backdrop-blur-sm">
          <div className={cn(
            "flex gap-2 mb-4",
            isCollapsed ? "flex-col items-center" : "items-center"
          )}>
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Invite Friends"
            >
              <Gift className="h-4 w-4" />
            </Button>
          </div>

          {/* Account button */}
          <Button
            variant="ghost"
            onClick={() => setAccountDialogOpen(true)}
            className={cn(
              "w-full transition-all duration-200 hover:bg-accent/50",
              isCollapsed ? "px-2 justify-center" : "px-4 justify-start gap-3"
            )}
          >
            {profilePictureUrl ? (
              <Avatar className={cn("h-8 w-8 ring-2 ring-border", isCollapsed && "mx-auto")}>
                <AvatarImage src={profilePictureUrl} alt="Profile" />
                <AvatarFallback>
                  <UserCircle className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserCircle className="h-8 w-8" />
            )}
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  Account
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
    </>
  );
}