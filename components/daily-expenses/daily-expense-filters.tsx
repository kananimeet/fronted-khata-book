"use client";

import React from "react";
import {
  Search,
  X,
  Filter,
  Calendar,
  Home,
  User as UserIcon,
  Clock,
  CheckCircle2,
  Users,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DailyExpenseFilterParams,
  DailyExpenseType,
  DailyExpenseStatus,
  CATEGORY_OPTIONS,
} from "@/types/daily-expense";
import { User } from "@/types/auth";
import { cn } from "@/lib/utils";

interface DailyExpenseFiltersProps {
  filters: DailyExpenseFilterParams;
  onFilterChange: (newFilters: Partial<DailyExpenseFilterParams>) => void;
  onResetFilters: () => void;
  isAdmin: boolean;
  users?: User[];
  isLoadingUsers?: boolean;
}

export type QuickTab = "all" | "room" | "own" | "pending" | "approved";

export function DailyExpenseFilters({
  filters,
  onFilterChange,
  onResetFilters,
  isAdmin,
  users = [],
  isLoadingUsers = false,
}: DailyExpenseFiltersProps) {
  // Determine current active quick tab
  const getActiveTab = (): QuickTab => {
    if (filters.status === "PENDING") return "pending";
    if (filters.status === "APPROVED") return "approved";
    if (filters.expense_type === "room") return "room";
    if (filters.expense_type === "own") return "own";
    return "all";
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: QuickTab) => {
    switch (tab) {
      case "all":
        onFilterChange({
          expense_type: "all",
          status: "all",
          page: 1,
        });
        break;
      case "room":
        onFilterChange({
          expense_type: "room",
          status: "all",
          page: 1,
        });
        break;
      case "own":
        onFilterChange({
          expense_type: "own",
          status: "all",
          page: 1,
        });
        break;
      case "pending":
        onFilterChange({
          expense_type: "all",
          status: "PENDING",
          page: 1,
        });
        break;
      case "approved":
        onFilterChange({
          expense_type: "all",
          status: "APPROVED",
          page: 1,
        });
        break;
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.expense_type && filters.expense_type !== "all") ||
      (filters.status && filters.status !== "all") ||
      (filters.category && filters.category !== "all") ||
      (filters.user_id && filters.user_id !== "all") ||
      filters.startDate ||
      filters.endDate
  );

  return (
    <div className="space-y-4">
      {/* 1. Quick Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar p-1 rounded-2xl glass-pill border border-white/60 dark:border-white/10 shadow-xs">
        <button
          type="button"
          onClick={() => handleTabChange("all")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
            activeTab === "all"
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>All Expenses</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("room")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
            activeTab === "room"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-3.5 w-3.5" />
          <span>Room Expenses</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("own")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
            activeTab === "own"
              ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-600/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UserIcon className="h-3.5 w-3.5" />
          <span>Personal (Own)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("pending")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
            activeTab === "pending"
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-600/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Pending Approvals</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("approved")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
            activeTab === "approved"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-600/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Approved</span>
        </button>
      </div>

      {/* 2. Search & Detailed Filter Inputs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl glass-card shadow-lg border border-white/60 dark:border-white/10">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search notes, items, description..."
            value={filters.search || ""}
            onChange={(e) =>
              onFilterChange({ search: e.target.value, page: 1 })
            }
            className="pl-9 pr-8 bg-background h-9 text-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: "", page: 1 })}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown Filter */}
          <div className="relative flex items-center min-w-[150px]">
            <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={filters.category || "all"}
              onChange={(e) =>
                onFilterChange({ category: e.target.value, page: 1 })
              }
              aria-label="Filter by category"
              className="h-9 w-full rounded-md border border-input bg-background pl-8.5 pr-8 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Member Filter Dropdown */}
          {(users.length > 0 || isAdmin) && (
            <div className="relative flex items-center min-w-[160px]">
              <Users className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={filters.user_id ? String(filters.user_id) : "all"}
                onChange={(e) =>
                  onFilterChange({
                    user_id: e.target.value === "all" ? "all" : e.target.value,
                    page: 1,
                  })
                }
                disabled={isLoadingUsers}
                aria-label="Filter by roommate"
                className="h-9 w-full rounded-md border border-input bg-background pl-8.5 pr-8 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all cursor-pointer disabled:opacity-60"
              >
                <option value="all">All Roommates</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 bg-background border border-input rounded-md px-2 h-9">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                onFilterChange({ startDate: e.target.value, page: 1 })
              }
              title="Start date"
              className="bg-transparent text-xs text-foreground outline-none w-[110px] cursor-pointer"
            />
            <span className="text-muted-foreground text-xs font-semibold">to</span>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) =>
                onFilterChange({ endDate: e.target.value, page: 1 })
              }
              title="End date"
              className="bg-transparent text-xs text-foreground outline-none w-[110px] cursor-pointer"
            />
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1.5 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
