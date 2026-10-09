"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { cn } from "@/lib/utils";
import { NotificationPermissionBanner } from "@/components/dashboard/notification-permission-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-indigo-50/90 via-pink-50/50 to-amber-50/60 dark:from-slate-950 dark:via-indigo-950/40 dark:to-purple-950/30 overflow-x-hidden selection:bg-violet-500 selection:text-white">
      {/* Ambient Blurred Color Blobs for Gradient Mesh */}
      <div
        className="pointer-events-none fixed -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-violet-400/20 dark:bg-violet-600/15 blur-3xl animate-pulse-subtle"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-fuchsia-400/20 dark:bg-fuchsia-600/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-24 left-1/3 h-[420px] w-[420px] rounded-full bg-amber-300/20 dark:bg-indigo-600/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Desktop Fixed Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Mobile Drawer (Sheet) */}
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
      />

      {/* Main Layout Container */}
      <div
        className={cn(
          "flex flex-1 flex-col min-h-screen transition-all duration-300 ease-in-out relative z-10",
          isCollapsed ? "md:pl-[72px]" : "md:pl-[260px]"
        )}
      >
        <Header
          isSidebarCollapsed={isCollapsed}
          onToggleSidebarCollapse={() => setIsCollapsed(!isCollapsed)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* Push Notification Permission Request Banner */}
        <NotificationPermissionBanner />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
