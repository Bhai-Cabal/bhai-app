"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import { DashboardNav } from "@/components/dashboard-nav";
import { TopNav } from "@/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, authenticated } = usePrivy();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  useEffect(() => {
    if (!authenticated) {
      router.push('/');
      return;
    }

    const checkUserData = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (error || !data) {
        router.push("/onboarding");
      }
    };

    checkUserData();
  }, [user, router, authenticated]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav className="md:hidden" />
      <DashboardNav 
        onCollapse={handleSidebarCollapse} 
        defaultCollapsed={true}
        className="hidden md:block" 
      />
      <div
        className={`transition-all duration-300 ease-in-out h-screen overflow-hidden ${
          isSidebarCollapsed 
            ? "ml-0 md:ml-20" 
            : "ml-0 md:ml-72"
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div className="min-h-full pb-16 md:pb-0 pt-16 md:pt-4 px-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}