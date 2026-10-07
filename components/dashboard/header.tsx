"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { navItems } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/dashboard/user-nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";

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

  // Find matching nav item or formulate title
  const currentNav = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = currentNav
    ? currentNav.title
    : pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-4 md:px-6 backdrop-blur-sm transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu button (visible on < md) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={onOpenMobileNav}
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar toggle button (visible on >= md) */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex text-muted-foreground hover:text-foreground"
          onClick={onToggleSidebarCollapse}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>

        {/* Dynamic Page Title */}
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
          {pageTitle}
        </h1>
      </div>

      {/* Right controls: Notifications, Theme toggle & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
