"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserNav } from "@/components/dashboard/user-nav";
import { NAV_LINKS } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KhataBookLogo } from "@/components/ui/logo";

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onOpenMobileNav: () => void;
}

export function Header({
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenMobileNav,
}: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Formulation of page title
  const currentNav = NAV_LINKS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = currentNav
    ? currentNav.title
    : pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  const userInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "NI";

  return (
    <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 px-4 md:px-8 backdrop-blur-2xl transition-colors select-none">
      <div className="flex items-center gap-3">
        {/* Mobile menu button (visible on < md) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-xl glass-pill text-muted-foreground hover:text-foreground"
          onClick={onOpenMobileNav}
          aria-label="Open mobile menu drawer"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar toggle button (visible on >= md) */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-9 w-9 rounded-xl glass-pill text-muted-foreground hover:text-foreground hover:bg-violet-500/10"
          onClick={onToggleSidebarCollapse}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar (260px)" : "Collapse sidebar (72px)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        {/* Dynamic Page Title */}
        <div className="flex items-center gap-2.5">
          <div className="md:hidden flex items-center">
            <KhataBookLogo size="xs" showText={false} href="/dashboard" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
            {pageTitle}
          </h1>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            Live Portal
          </span>
        </div>
      </div>

      {/* Right controls: Notifications, Theme toggle & User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Notification Bell with Badge */}
        <div className="relative">
          <NotificationBell />
        </div>

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* User Navigation Dropdown / Avatar */}
        <UserNav />
      </div>
    </header>
  );
}
