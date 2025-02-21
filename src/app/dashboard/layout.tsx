"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = usePrivy();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  useEffect(() => {
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
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background ">
      <DashboardNav onCollapse={handleSidebarCollapse} defaultCollapsed={true} />
      <div
        className={`transition-all duration-300 ease-in-out h-screen ${
          isSidebarCollapsed ? "ml-20" : "ml-72"
        }`}
      >
        {children}
      </div>
    </div>
  );
}