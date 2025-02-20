"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
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