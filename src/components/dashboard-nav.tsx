"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UserCircle,
  Settings,
  LogOut,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AccountDialog } from "./AccountDialog";

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
  const pathname = usePathname();
  const { logout } = usePrivy();

  return (
    <div className="w-64 border-r bg-card min-h-screen p-4 flex flex-col justify-between fixed h-screen gap-2">
      <div className="space-y-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "transparent"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="ml-4 bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          onClick={() => setAccountDialogOpen(true)}
          className="w-full justify-start px-3 py-2"
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Account</span>
        </Button>
      </div>
      <div className="ml-4 bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          className="w-full justify-start px-3 py-2"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
      {/* Account Dialog */}
      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
    </div>
  );
}