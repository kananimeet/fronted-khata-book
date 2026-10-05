"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Home,
  RotateCw,
  PlusCircle,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getExpenses } from "@/lib/expense-api";
import { getDailyExpenses } from "@/lib/daily-expense-api";
import { Expense } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyExpensesChart } from "@/components/dashboard/daily-expenses-chart";

const DASHBOARD_CACHE_KEY = "khatabook_dashboard_cache";

interface CachedDashboardData {
  expenses: Expense[];
  totalCount: number;
  pendingCount: number;
  summary: {
    totalRoomRate: number;
    totalApproved: number;
    totalPending: number;
    totalRemaining: number;
  };
  dailySpent?: number;
  dailyCount?: number;
  timestamp: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [dailySpent, setDailySpent] = useState<number>(0);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [summary, setSummary] = useState({
    totalRoomRate: 0,
    totalApproved: 0,
    totalPending: 0,
    totalRemaining: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Hydrate from localStorage strictly on client post-hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const item = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (item) {
        const cached = JSON.parse(item);
        if (cached) {
          if (cached.expenses) setExpenses(cached.expenses);
          if (typeof cached.totalCount === "number") setTotalCount(cached.totalCount);
          if (typeof cached.pendingCount === "number") setPendingCount(cached.pendingCount);
          if (typeof cached.dailySpent === "number") setDailySpent(cached.dailySpent);
          if (typeof cached.dailyCount === "number") setDailyCount(cached.dailyCount);
          if (cached.summary) setSummary(cached.summary);
          setIsLoading(false);
        }
      }
    } catch {}
  }, []);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Parallel fetch fresh expenses and daily room expenses
      const [data, dailyRes] = await Promise.all([
        getExpenses({ page: 1, limit: 10 }, true),
        getDailyExpenses({ limit: 100, forceRefresh: true }).catch(() => null),
      ]);

      let currentDailySpent = 0;
      let currentDailyCount = 0;
      if (dailyRes?.summary) {
        currentDailySpent =
          Number(dailyRes.summary.totalRoomAmount ?? dailyRes.summary.totalAmount) || 0;
        currentDailyCount =
          Number(dailyRes.summary.approvedCount ?? dailyRes.pagination?.total) || 0;
        setDailySpent(currentDailySpent);
        setDailyCount(currentDailyCount);
      }

      if (data) {
        let items: Expense[] = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (Array.isArray(data.items)) {
          items = data.items;
        } else if (Array.isArray(data.expenses)) {
          items = data.expenses;
        } else if (Array.isArray(data.data)) {
          items = data.data;
        } else if (Array.isArray(data.rows)) {
          items = data.rows;
        }

        const total =
          typeof data.meta?.total === "number"
            ? data.meta.total
            : typeof data.total === "number"
            ? data.total
            : typeof data.totalCount === "number"
            ? data.totalCount
            : items.length;

        setExpenses(items);
        setTotalCount(total);

        // Count pending (initial pending requests or pending installment payments)
        const pending = items.filter(
          (e) =>
            e.status === "PENDING" ||
            e.payments?.some((p) => p.status === "PENDING")
        ).length;
        setPendingCount(pending);

        // Calculate any pending installments omitted in backend summary
        const additionalPendingInstallments = items.reduce((acc, it) => {
          if (it.status === "PENDING") return acc;
          const p = it.payments?.find((pay) => pay.status === "PENDING");
          if (p) return acc + (Number(p.amount) || 0);
          return acc;
        }, 0);

        let newSummary = {
          totalRoomRate: 0,
          totalApproved: 0,
          totalPending: 0,
          totalRemaining: 0,
        };

        // Summary totals
        if (data.summary) {
          const rawPending =
            Number(
              data.summary.totalPending ?? data.summary.totalPendingAmount
            ) || 0;

          newSummary = {
            totalRoomRate:
              Number(
                data.summary.totalRoomRate ?? data.summary.totalRoomRateAmount
              ) || 0,
            totalApproved:
              Number(
                data.summary.totalApproved ?? data.summary.totalApprovedAmount
              ) || 0,
            totalPending: rawPending + additionalPendingInstallments,
            totalRemaining:
              Number(
                data.summary.totalRemaining ??
                  data.summary.totalRemainingAmount
              ) || 0,
          };
        } else {
          let roomRate = 0;
          let approved = 0;
          let pend = 0;
          let rem = 0;
          items.forEach((item) => {
            roomRate += Number(item.total_amount) || 0;
            approved += Number(item.paid_amount) || 0;
            if (item.status === "PENDING") {
              pend += Number(item.pay_amount) || 0;
            } else {
              const pendingP = item.payments?.find((p) => p.status === "PENDING");
              if (pendingP) {
                pend += Number(pendingP.amount) || 0;
              }
            }
            rem += Number(item.remaining_amount) || 0;
          });

          newSummary = {
            totalRoomRate: roomRate,
            totalApproved: approved,
            totalPending: pend,
            totalRemaining: rem,
          };
        }

        // User formula: Total Approved Paid - Total Daily Expenses = Total Room Rate
        if (newSummary.totalApproved > 0 || currentDailySpent > 0) {
          newSummary.totalRoomRate = Math.max(
            0,
            newSummary.totalApproved - currentDailySpent
          );
        }

        setSummary(newSummary);

        // Cache latest data into localStorage for instant 0ms reload on refresh
        try {
          if (typeof window !== "undefined") {
            const cachePayload: CachedDashboardData = {
              expenses: items,
              totalCount: total,
              pendingCount: pending,
              summary: newSummary,
              dailySpent: currentDailySpent,
              dailyCount: currentDailyCount,
              timestamp: Date.now(),
            };
            localStorage.setItem(
              DASHBOARD_CACHE_KEY,
              JSON.stringify(cachePayload)
            );
          }
        } catch {
          // Ignore localStorage quota errors
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard expense data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // User's formula: Total Approved Paid - Total Daily Expenses = Total Room Rate
  const netRoomRate =
    summary.totalApproved > 0 || dailySpent > 0
      ? Math.max(0, summary.totalApproved - dailySpent)
      : summary.totalRoomRate;

  const totalTarget = summary.totalApproved + summary.totalRemaining;
  const collectionRate =
    totalTarget > 0
      ? Math.min(100, Math.round((summary.totalApproved / totalTarget) * 100))
      : summary.totalApproved > 0
      ? 100
      : 0;

  const statCards = [
    {
      title: "Total Room Rate",
      value: formatCurrency(netRoomRate),
      subtitle:
        dailySpent > 0
          ? `Cut by ${formatCurrency(dailySpent)} groceries`
          : `${totalCount} room contracts`,
      icon: Home,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      accent: "from-blue-500/10 to-transparent",
    },
    {
      title: "Total Daily Expenses",
      value: formatCurrency(dailySpent),
      subtitle: `${dailyCount} approved grocery items`,
      icon: ShoppingBag,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10 border-indigo-500/20",
      accent: "from-indigo-500/10 to-transparent",
    },
    {
      title: "Total Approved Paid",
      value: formatCurrency(summary.totalApproved),
      subtitle: `${collectionRate}% of total collected`,
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      title: "Total Pending Approval",
      value: formatCurrency(summary.totalPending),
      subtitle: `${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting review`,
      icon: Clock,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      title: "Total Remaining Due",
      value: formatCurrency(summary.totalRemaining),
      subtitle: "Outstanding balance due",
      icon: AlertTriangle,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
      accent: "from-purple-500/10 to-transparent",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Dashboard Overview
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Welcome back{user?.name ? `, ${user.name}` : ""}! Here is the live
                summary of room rate expenses, counts, and payments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            title="Refresh dashboard stats"
            className="h-9 w-9"
          >
            <RotateCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
          </Button>

          <Button asChild className="gap-2 font-semibold shadow-xs h-9 bg-primary">
            <Link href="/expenses">
              <PlusCircle className="h-4 w-4" />
              <span>Room Expenses</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="relative overflow-hidden border-border shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-50 pointer-events-none`}
              />
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${stat.bgColor} ${stat.iconColor} shadow-2xs`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {isLoading ? (
                      <Skeleton className="h-8 w-28 my-1" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {isLoading ? (
                      <Skeleton className="h-3.5 w-36" />
                    ) : (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{stat.subtitle}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Expenses Monthly & Yearly Analytics Graph */}
      <DailyExpensesChart />
    </div>
  );
}
