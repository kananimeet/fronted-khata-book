"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { DailyExpenseSummary } from "@/types/daily-expense";
import {
  Wallet,
  Home,
  User as UserIcon,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface DailyExpenseStatsProps {
  summary?: DailyExpenseSummary;
  isLoading?: boolean;
}

export function DailyExpenseStats({
  summary,
  isLoading = false,
}: DailyExpenseStatsProps) {
  const totalAmount = summary?.totalAmount ?? 0;
  const totalRoomAmount = summary?.totalRoomAmount ?? 0;
  const totalOwnAmount = summary?.totalOwnAmount ?? 0;
  const pendingCount = summary?.pendingCount ?? 0;
  const approvedCount = summary?.approvedCount ?? 0;

  const stats = [
    {
      title: "Total Spent",
      value: formatCurrency(totalAmount),
      subtitle: `${approvedCount} approved expenses recorded`,
      icon: Wallet,
      gradient: "from-blue-600/15 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      accentBar: "bg-blue-500",
      badge: null,
    },
    {
      title: "Room Expenses",
      value: formatCurrency(totalRoomAmount),
      subtitle: "Credited towards room rent",
      icon: Home,
      gradient: "from-indigo-600/15 via-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      accentBar: "bg-indigo-500",
      badge: {
        text: "Shared Groceries",
        variant: "indigo",
      },
    },
    {
      title: "Personal Expenses",
      value: formatCurrency(totalOwnAmount),
      subtitle: "Settled individually by user",
      icon: UserIcon,
      gradient: "from-purple-600/15 via-purple-500/5 to-transparent",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      accentBar: "bg-purple-500",
      badge: {
        text: "Own",
        variant: "purple",
      },
    },
    {
      title: "Pending Approvals",
      value: pendingCount.toString(),
      subtitle: pendingCount === 1 ? "1 item awaiting review" : `${pendingCount} items awaiting review`,
      icon: Clock,
      gradient: "from-amber-600/15 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      accentBar: "bg-amber-500",
      badge: pendingCount > 0 ? {
        text: "Action Needed",
        variant: "amber",
      } : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card
            key={idx}
            className="relative overflow-hidden border border-border/70 bg-card/90 shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            {/* Top Accent Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${stat.accentBar}`} />

            {/* Subtle Gradient Backdrop */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
            />

            <CardContent className="p-5 relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-28 my-1" />
                  ) : (
                    <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                      {stat.value}
                    </h3>
                  )}
                </div>

                <div
                  className={`p-2.5 rounded-xl border shadow-xs shrink-0 transition-transform group-hover:scale-105 ${stat.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                {isLoading ? (
                  <Skeleton className="h-4 w-36" />
                ) : (
                  <>
                    <span className="text-muted-foreground truncate">
                      {stat.subtitle}
                    </span>
                    {stat.badge && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                          stat.badge.variant === "amber"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                            : stat.badge.variant === "indigo"
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                            : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {stat.badge.text}
                      </span>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
