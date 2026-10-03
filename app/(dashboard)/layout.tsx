"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Fixed Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Mobile Drawer */}
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />

      {/* Main Layout Container */}
      <div
        className={cn(
          "flex flex-1 flex-col min-h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <Header
          isSidebarCollapsed={isCollapsed}
          onToggleSidebarCollapse={() => setIsCollapsed(!isCollapsed)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* Independently Scrollable Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
