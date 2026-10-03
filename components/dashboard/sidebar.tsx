"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

import { navItems } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-card border-r border-border transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Header / Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4 transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden font-semibold text-foreground group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold tracking-tight whitespace-nowrap truncate">
              KhataBook
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Items List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {!isCollapsed && (
                <span className="truncate whitespace-nowrap">{item.title}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle Footer Button */}
      <div className="p-2 border-t border-border flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "w-full text-muted-foreground hover:text-foreground",
            isCollapsed && "px-0"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-2 w-full px-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-normal">Collapse</span>
            </div>
          )}
        </Button>
      </div>
    </aside>
  );
}
