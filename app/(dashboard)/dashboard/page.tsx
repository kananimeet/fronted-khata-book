"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Home,
  RotateCw,
  PlusCircle,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getExpenses } from "@/lib/expense-api";
import { getDailyExpenses, getDailyExpensesChart } from "@/lib/daily-expense-api";
import { Expense } from "@/types/expense";
import { DailyExpensesChartResponse, DailyExpense } from "@/types/daily-expense";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Transaction, ExpenseCategory, ExpenseStatus } from "@/lib/mock-data";
import { formatINR } from "@/lib/format";

const DASHBOARD_CACHE_KEY = "bachelorsbook_dashboard_cache_v4";
const OLD_DASHBOARD_CACHE_KEY = "khatabook_dashboard_cache_v3";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getItemDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal === "number") {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    const parts = trimmed.split("T")[0].split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parts[2] ? parseInt(parts[2], 10) : 1;
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return null;
}

function matchesPeriod(
  dateVal: any,
  year: number,
  month: number,
  viewMode: "monthly" | "yearly"
): boolean {
  const d = getItemDate(dateVal);
  if (!d) return false;
  if (viewMode === "yearly") {
    return d.getFullYear() === year;
  }
  return d.getFullYear() === year && d.getMonth() === month;
}

function isBeforeMonth(
  dateVal: any,
  targetYear: number,
  targetMonth: number
): boolean {
  const d = getItemDate(dateVal);
  if (!d) return false;
  if (d.getFullYear() < targetYear) return true;
  if (d.getFullYear() === targetYear && d.getMonth() < targetMonth) return true;
  return false;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const currentDate = useMemo(() => new Date(), []);

  // Time & View states
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [barLayout, setBarLayout] = useState<"stacked" | "grouped">("stacked");

  // Raw items state for fast, reactive monthly filtering
  const [rawDailyExpenses, setRawDailyExpenses] = useState<DailyExpense[]>([]);
  const [rawRoomExpenses, setRawRoomExpenses] = useState<Expense[]>([]);
  const [rawRoomSummary, setRawRoomSummary] = useState<any>(null);

  const [chartData, setChartData] = useState<DailyExpensesChartResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

  // Check if active selection is current period
  const isCurrentPeriod = useMemo(() => {
    if (viewMode === "yearly") {
      return selectedYear === currentDate.getFullYear();
    }
    return (
      selectedYear === currentDate.getFullYear() &&
      selectedMonth === currentDate.getMonth()
    );
  }, [viewMode, selectedYear, selectedMonth, currentDate]);

  // Hydrate from localStorage on client mount for instant render
  useEffect(() => {
    try {
      const item =
        localStorage.getItem(DASHBOARD_CACHE_KEY) ||
        localStorage.getItem(OLD_DASHBOARD_CACHE_KEY);
      if (item) {
        const cached = JSON.parse(item);
        if (cached) {
          if (Array.isArray(cached.rawDailyExpenses)) setRawDailyExpenses(cached.rawDailyExpenses);
          if (Array.isArray(cached.rawRoomExpenses)) setRawRoomExpenses(cached.rawRoomExpenses);
          if (cached.rawRoomSummary) setRawRoomSummary(cached.rawRoomSummary);
          setIsLoading(false);
        }
      }
    } catch { }
  }, []);

  // Fetch Chart Data dynamically whenever Year or Month changes
  const fetchChart = useCallback(
    async (year: number, month: number, forceRefresh = false) => {
      setIsChartLoading(true);
      try {
        const data = await getDailyExpensesChart(year, month + 1, forceRefresh);
        setChartData(data);
      } catch (err) {
        console.error("Failed to load dynamic chart data:", err);
      } finally {
        setIsChartLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchChart(selectedYear, selectedMonth, false);
  }, [fetchChart, selectedYear, selectedMonth]);

  // Main Dashboard Data Fetch (Expenses + Daily Expenses)
  const fetchDashboardData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const [roomData, dailyRes] = await Promise.all([
          getExpenses({ page: 1, limit: 200 }, true).catch(() => null),
          getDailyExpenses({ limit: 500, forceRefresh: true }).catch(() => null),
          fetchChart(selectedYear, selectedMonth, isManualRefresh),
        ]);

        let dailyItems: DailyExpense[] = [];
        if (dailyRes) {
          const rawRes = dailyRes as any;
          dailyItems = Array.isArray(rawRes?.items)
            ? rawRes.items
            : Array.isArray(rawRes?.data)
              ? rawRes.data
              : Array.isArray(rawRes)
                ? rawRes
                : [];
          setRawDailyExpenses(dailyItems);
        }

        let roomItems: Expense[] = [];
        let rSummary = null;
        if (roomData) {
          if (Array.isArray(roomData)) roomItems = roomData;
          else if (Array.isArray(roomData.items)) roomItems = roomData.items;
          else if (Array.isArray(roomData.expenses)) roomItems = roomData.expenses;
          else if (Array.isArray(roomData.data)) roomItems = roomData.data;
          setRawRoomExpenses(roomItems);

          if (roomData.summary) {
            rSummary = {
              totalRoomRate:
                Number(roomData.summary.totalRoomRate ?? roomData.summary.totalRoomRateAmount) || 0,
              totalApproved:
                Number(roomData.summary.totalApproved ?? roomData.summary.totalApprovedAmount) || 0,
              totalPending:
                Number(roomData.summary.totalPending ?? roomData.summary.totalPendingAmount) || 0,
              totalRemaining:
                Number(roomData.summary.totalRemaining ?? roomData.summary.totalRemainingAmount) || 0,
            };
            setRawRoomSummary(rSummary);
          }
        }

        // Cache locally for fast re-hydration
        try {
          localStorage.setItem(
            DASHBOARD_CACHE_KEY,
            JSON.stringify({
              rawDailyExpenses: dailyItems,
              rawRoomExpenses: roomItems,
              rawRoomSummary: rSummary,
              timestamp: Date.now(),
            })
          );
        } catch { }
      } catch (err) {
        console.error("Failed to load live dashboard stats:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchChart, selectedYear, selectedMonth]
  );

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh when expenses/payments change anywhere in the app
    const handleDataUpdated = () => {
      fetchDashboardData(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("bachelorsbook_data_updated", handleDataUpdated);
      window.addEventListener("khatabook_data_updated", handleDataUpdated);
      return () => {
        window.removeEventListener("bachelorsbook_data_updated", handleDataUpdated);
        window.removeEventListener("khatabook_data_updated", handleDataUpdated);
      };
    }
  }, [fetchDashboardData]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMode === "monthly") {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear((y) => y - 1);
      } else {
        setSelectedMonth((m) => m - 1);
      }
    } else {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMode === "monthly") {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear((y) => y + 1);
      } else {
        setSelectedMonth((m) => m + 1);
      }
    } else {
      setSelectedYear((y) => y + 1);
    }
  };

  const handleResetMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    setViewMode("monthly");
  };

  // Dynamically compute exact monthly figures for the selected period
  const monthlyMetrics = useMemo(() => {
    // 1. Daily Expenses in this period
    const periodDaily = rawDailyExpenses.filter((item) =>
      matchesPeriod(item.expense_date || item.created_at, selectedYear, selectedMonth, viewMode)
    );

    const approvedRoomDaily = periodDaily.filter(
      (item) =>
        (item.expense_type === "room" || (item as any).category === "room") &&
        item.status === "APPROVED"
    );

    let dailySpent = approvedRoomDaily.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    let dailyCount = approvedRoomDaily.length;

    // 2. Room Rent & Collections in this period
    const periodRoom = rawRoomExpenses.filter((item) =>
      matchesPeriod(item.created_at, selectedYear, selectedMonth, viewMode)
    );

    let roomRate = 0;
    let approved = 0;
    let pending = 0;
    let remaining = 0;
    let activeCollectionsCount = periodRoom.length;
    let pendingRequestsCount = 0;

    periodRoom.forEach((item) => {
      if (item.status === "COMPLETE" || item.status === "REMAINING") {
        roomRate += Number(item.total_amount) || 0;
        remaining += Number(item.remaining_amount) || 0;
      }
      approved += Number(item.paid_amount) || 0;
      if (item.status === "PENDING") {
        pending += Number(item.pay_amount) || 0;
        pendingRequestsCount++;
      } else {
        const pendingP = item.payments?.find((p) => p.status === "PENDING");
        if (pendingP) {
          pending += Number(pendingP.amount) || 0;
          pendingRequestsCount++;
        }
      }
    });

    // Also include payments made during this period for room expenses created earlier
    rawRoomExpenses.forEach((item) => {
      if (!matchesPeriod(item.created_at, selectedYear, selectedMonth, viewMode)) {
        item.payments?.forEach((p) => {
          if (matchesPeriod(p.created_at, selectedYear, selectedMonth, viewMode)) {
            if (p.status === "APPROVED") {
              approved += Number(p.amount) || 0;
            } else if (p.status === "PENDING") {
              pending += Number(p.amount) || 0;
              pendingRequestsCount++;
            }
          }
        });
      }
    });

    // Fallback strictly for the current active period if items lack dates in DB
    if (isCurrentPeriod) {
      if (approved === 0 && rawRoomSummary?.totalApproved > 0) {
        approved = Number(rawRoomSummary.totalApproved) || 0;
        roomRate = Number(rawRoomSummary.totalRoomRate) || 0;
        remaining = Number(rawRoomSummary.totalRemaining) || 0;
        pending = Number(rawRoomSummary.totalPending) || 0;
      }
      if (dailySpent === 0 && chartData?.summary?.monthRoom && viewMode === "monthly") {
        dailySpent = Number(chartData.summary.monthRoom) || 0;
      }
    }

    // 3. CARRY-FORWARD: Calculate cumulative balance up to previous month
    let carriedForwardBalance = 0;
    if (viewMode === "monthly") {
      let prevApproved = 0;
      let prevDailySpent = 0;

      // Previous room collections before this month
      rawRoomExpenses.forEach((item) => {
        if (isBeforeMonth(item.created_at, selectedYear, selectedMonth)) {
          prevApproved += Number(item.paid_amount) || 0;
        }
        item.payments?.forEach((p) => {
          if (isBeforeMonth(p.created_at, selectedYear, selectedMonth)) {
            if (p.status === "APPROVED") {
              if (!isBeforeMonth(item.created_at, selectedYear, selectedMonth)) {
                prevApproved += Number(p.amount) || 0;
              }
            }
          }
        });
      });

      // Previous room daily expenses before this month
      rawDailyExpenses.forEach((item) => {
        if (
          (item.expense_type === "room" || (item as any).category === "room") &&
          item.status === "APPROVED" &&
          isBeforeMonth(item.expense_date || item.created_at, selectedYear, selectedMonth)
        ) {
          prevDailySpent += Number(item.amount) || 0;
        }
      });

      carriedForwardBalance = Math.max(0, prevApproved - prevDailySpent);
    }

    // Net Room Rate: Carried Forward Balance + Current Month Approved - Current Month Daily Expenses
    const netRoomRate = Math.max(
      0,
      carriedForwardBalance + approved - dailySpent
    );

    const totalTarget = approved + remaining;
    const collectionRate =
      totalTarget > 0
        ? Math.min(100, Math.round((approved / totalTarget) * 100))
        : approved > 0
          ? 100
          : 0;

    return {
      netRoomRate,
      carriedForwardBalance,
      dailySpent,
      dailyCount,
      approved,
      collectionRate,
      pending,
      pendingRequestsCount,
      remaining,
      activeCollectionsCount,
    };
  }, [
    rawDailyExpenses,
    rawRoomExpenses,
    rawRoomSummary,
    selectedYear,
    selectedMonth,
    viewMode,
    isCurrentPeriod,
    chartData,
  ]);

  // Extract dynamic sparkline series from real daily trend
  const sparklineRoom = useMemo(() => {
    const trend = chartData?.dailyTrend || [];
    if (trend.length === 0 || monthlyMetrics.netRoomRate === 0) {
      return [monthlyMetrics.netRoomRate, monthlyMetrics.netRoomRate];
    }
    const pts = trend.slice(-7).map((d) => d.room);
    return pts.length >= 2 ? pts : [0, monthlyMetrics.netRoomRate];
  }, [chartData, monthlyMetrics.netRoomRate]);

  const sparklineDaily = useMemo(() => {
    const trend = chartData?.dailyTrend || [];
    if (trend.length === 0 || monthlyMetrics.dailySpent === 0) {
      return [monthlyMetrics.dailySpent, monthlyMetrics.dailySpent];
    }
    const pts = trend.slice(-7).map((d) => d.total);
    return pts.length >= 2 ? pts : [0, monthlyMetrics.dailySpent];
  }, [chartData, monthlyMetrics.dailySpent]);

  const sparklineApproved = useMemo(() => {
    const monthly = chartData?.monthlyTrend || [];
    if (monthly.length === 0 || monthlyMetrics.approved === 0) {
      return [monthlyMetrics.approved, monthlyMetrics.approved];
    }
    const pts = monthly.slice(-7).map((m) => m.total);
    return pts.length >= 2 ? pts : [0, monthlyMetrics.approved];
  }, [chartData, monthlyMetrics.approved]);

  const sparklinePending = useMemo(() => {
    return [monthlyMetrics.pending, monthlyMetrics.pending];
  }, [monthlyMetrics.pending]);

  const sparklineRemaining = useMemo(() => {
    return [monthlyMetrics.remaining, monthlyMetrics.remaining];
  }, [monthlyMetrics.remaining]);

  // 5 KPI Stat Cards reflecting the active monthly selection
  const kpiCards = [
    {
      title: "Available Room Balance",
      value: monthlyMetrics.netRoomRate,
      subtitle:
        monthlyMetrics.carriedForwardBalance > 0
          ? monthlyMetrics.dailySpent > 0
            ? `Net balance after ${formatINR(monthlyMetrics.dailySpent)} (incl. ${formatINR(monthlyMetrics.carriedForwardBalance)} carried fwd)`
            : `Includes ${formatINR(monthlyMetrics.carriedForwardBalance)} carried forward`
          : monthlyMetrics.dailySpent > 0
            ? `Net balance after ${formatINR(monthlyMetrics.dailySpent)} expenses`
            : `${monthlyMetrics.activeCollectionsCount} active room collections`,
      icon: Home,
      variant: "blue" as const,
      sparklineData: sparklineRoom,
    },
    {
      title: "Total Daily Expenses",
      value: monthlyMetrics.dailySpent,
      subtitle: `${monthlyMetrics.dailyCount} approved grocery items`,
      icon: ShoppingBag,
      variant: "violet" as const,
      sparklineData: sparklineDaily,
    },
    {
      title: "Total Approved Paid",
      value: monthlyMetrics.approved,
      subtitle: `${monthlyMetrics.collectionRate}% of total collected`,
      icon: CheckCircle2,
      variant: "emerald" as const,
      sparklineData: sparklineApproved,
    },
    {
      title: "Total Pending Approval",
      value: monthlyMetrics.pending,
      subtitle: `${monthlyMetrics.pendingRequestsCount} request${monthlyMetrics.pendingRequestsCount === 1 ? "" : "s"} awaiting review`,
      icon: Clock,
      variant: "amber" as const,
      sparklineData: sparklinePending,
    },
    {
      title: "Total Remaining Due",
      value: monthlyMetrics.remaining,
      subtitle: "Outstanding balance due",
      icon: AlertTriangle,
      variant: "rose" as const,
      sparklineData: sparklineRemaining,
    },
  ];

  // Dynamic Category Breakdown for Donut Chart
  const activeCategories = useMemo(() => {
    if (!chartData) return [];
    if (viewMode === "monthly") {
      return chartData.monthCategoryBreakdown || chartData.categoryBreakdown || [];
    }
    return chartData.yearCategoryBreakdown || chartData.categoryBreakdown || [];
  }, [chartData, viewMode]);

  const activePeriodTotal = useMemo(() => {
    if (viewMode === "monthly") {
      return Number(chartData?.summary?.monthTotal) || monthlyMetrics.dailySpent;
    }
    return Number(chartData?.summary?.yearTotal) || monthlyMetrics.dailySpent;
  }, [chartData, viewMode, monthlyMetrics.dailySpent]);

  // Filter transactions for active month
  const liveTransactions = useMemo<Transaction[]>(() => {
    const periodItems = rawDailyExpenses.filter((item) =>
      matchesPeriod(item.expense_date || item.created_at, selectedYear, selectedMonth, viewMode)
    );

    return periodItems.slice(0, 10).map((item, idx) => {
      const rawCat = String(item.category || "OTHER").toUpperCase();
      let catName: ExpenseCategory = "Other";
      let color = "text-indigo-700 dark:text-indigo-300";
      let bg = "bg-indigo-500/15 border-indigo-500/30";

      if (rawCat.includes("GROCERY")) {
        catName = "Groceries";
        color = "text-violet-700 dark:text-violet-300";
        bg = "bg-violet-500/15 border-violet-500/30";
      } else if (rawCat.includes("VEG")) {
        catName = "Vegetables";
        color = "text-emerald-700 dark:text-emerald-300";
        bg = "bg-emerald-500/15 border-emerald-500/30";
      } else if (rawCat.includes("MILK") || rawCat.includes("DAIRY")) {
        catName = "Milk";
        color = "text-cyan-700 dark:text-cyan-300";
        bg = "bg-cyan-500/15 border-cyan-500/30";
      } else if (rawCat.includes("GAS")) {
        catName = "Gas";
        color = "text-orange-700 dark:text-orange-300";
        bg = "bg-orange-500/15 border-orange-500/30";
      } else if (
        rawCat.includes("BILL") ||
        rawCat.includes("ELECTRIC") ||
        rawCat.includes("WATER")
      ) {
        catName = "Utilities";
        color = "text-pink-700 dark:text-pink-300";
        bg = "bg-pink-500/15 border-pink-500/30";
      }

      const userName = item.user?.name || (item as any).paid_by?.name || "Member";
      const initials =
        userName
          .trim()
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "MB";

      const d = item.expense_date ? new Date(item.expense_date) : new Date();

      return {
        id: String(item.id || `tx-${idx}`),
        title: item.note || item.category || "Expense Item",
        category: catName,
        categoryColor: color,
        categoryBg: bg,
        amount: Number(item.amount) || 0,
        date: d.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        paidBy: { name: userName, initials },
        type: item.expense_type === "room" ? "room" : "personal",
        status: (item.status?.toUpperCase() || "APPROVED") as ExpenseStatus,
      };
    });
  }, [rawDailyExpenses, selectedYear, selectedMonth, viewMode]);

  const userName = user?.name || "Nirav";

  return (
    <div className="space-y-7 max-w-[1440px] mx-auto pb-10">
      {/* Hero Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/50 dark:ring-white/10 shrink-0">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Dashboard Overview
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <Calendar className="h-3 w-3" />
                {viewMode === "monthly"
                  ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                  : `${selectedYear}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Welcome back, <span className="font-semibold text-foreground">{userName}</span>!{" "}
              {viewMode === "monthly"
                ? `Live summary for ${MONTH_NAMES_FULL[selectedMonth]} ${selectedYear}.`
                : `Live summary for Year ${selectedYear}.`}
            </p>
          </div>
        </div>

        {/* Right Action Controls: Month Navigator, Refresh & Room Rent & Collections Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Top Month / Year Selector */}
          <div className="flex items-center p-1 rounded-xl glass-pill border border-white/60 dark:border-white/10 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              title="Previous Month"
              aria-label="Previous Month"
              className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-violet-500" />
              <span>
                {viewMode === "monthly"
                  ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                  : `${selectedYear}`}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              title="Next Month"
              aria-label="Next Month"
              className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {!isCurrentPeriod && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetMonth}
                title="Reset to current month"
                aria-label="Reset to current month"
                className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            title="Refresh live metrics from backend"
            aria-label="Refresh dashboard metrics"
            className="h-10 w-10 rounded-xl glass-pill shadow-xs hover:border-violet-500/40 cursor-pointer"
          >
            <RotateCw
              className={`h-4 w-4 text-muted-foreground hover:text-foreground ${
                isRefreshing ? "animate-spin text-violet-600" : ""
              }`}
            />
          </Button>

          <Button
            asChild
            className="h-10 px-4 rounded-xl gap-2 font-bold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Link href="/expenses">
              <PlusCircle className="h-4 w-4 shrink-0" />
              <span>Room Rent & Collections</span>
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Five KPI Stat Cards (Responsive Grid: 1 col mobile, 2 tablet, 5 desktop) */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((card, idx) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            variant={card.variant}
            sparklineData={card.sparklineData}
            delay={idx}
          />
        ))}
      </div>

      {/* Daily Expense Analytics & Category Share (2/3 + 1/3 Split) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Left (2/3 width): Dynamic BarChart of Daily Totals */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-6 shadow-xl border border-white/60 dark:border-white/10">
          <ExpenseChart
            chartData={chartData}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            barLayout={barLayout}
            onBarLayoutChange={setBarLayout}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onReset={handleResetMonth}
            isLoading={isChartLoading || isLoading}
          />
        </div>

        {/* Right (1/3 width): Dynamic Category Share Donut Chart */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 shadow-xl border border-white/60 dark:border-white/10">
          <CategoryDonut
            categories={activeCategories}
            totalAmount={activePeriodTotal}
            periodLabel={
              viewMode === "monthly"
                ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                : `${selectedYear}`
            }
            isLoading={isChartLoading || isLoading}
          />
        </div>
      </motion.div>

      {/* Live Recent Transactions Feed */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <RecentTransactions transactions={liveTransactions} isLoading={isLoading} />
      </motion.div>
    </div>
  );
}
