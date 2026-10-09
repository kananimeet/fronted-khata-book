"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  IndianRupee,
  ShoppingBag,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KhataBookLogo } from "@/components/ui/logo";
import { useAuth } from "@/context/auth-context";

export const NAV_LINKS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Room Expenses",
    href: "/expenses",
    icon: IndianRupee,
  },
  {
    title: "Daily Expenses",
    href: "/daily-expenses",
    icon: ShoppingBag,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    adminOnly: true,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({ isCollapsed, onToggleCollapse, className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const visibleLinks = NAV_LINKS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out select-none",
        "bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl",
        "border-r border-white/50 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-none",
        isCollapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* Top Logo Mark */}
      <div
        className={cn(
          "flex h-20 items-center border-b border-border/50 px-4 transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "justify-between"
        )}
      >
        <KhataBookLogo
          size={isCollapsed ? "sm" : "md"}
          showText={!isCollapsed}
          href="/dashboard"
          className={isCollapsed ? "justify-center" : ""}
        />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Main Menu
          </div>
        )}

        {visibleLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30 scale-[1.01]"
                  : "text-muted-foreground hover:bg-violet-500/10 hover:text-foreground",
                isCollapsed && "justify-center px-2 py-3"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400"
                )}
              />
              {!isCollapsed && (
                <span className="truncate tracking-tight">{item.title}</span>
              )}

              {/* Active pill indicator bar on collapsed */}
              {isCollapsed && isActive && (
                <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Collapse Action */}
      <div className="p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "w-full rounded-xl text-muted-foreground hover:text-foreground hover:bg-violet-500/10 h-10 transition-colors",
            isCollapsed && "px-0 justify-center"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center justify-between w-full px-2 text-xs font-medium">
              <span className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                260px
              </span>
            </div>
          )}
        </Button>
      </div>
    </aside>
  );
}
