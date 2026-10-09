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

const DASHBOARD_CACHE_KEY = "khatabook_dashboard_cache_v3";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function DashboardPage() {
  const { user } = useAuth();
  const currentDate = useMemo(() => new Date(), []);

  // Time & View states
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [barLayout, setBarLayout] = useState<"stacked" | "grouped">("stacked");

  // Live Data States
  const [summary, setSummary] = useState({
    totalRoomRate: 0,
    totalApproved: 0,
    totalPending: 0,
    totalRemaining: 0,
  });
  const [dailySpent, setDailySpent] = useState<number>(0);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const [chartData, setChartData] = useState<DailyExpensesChartResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

  // Hydrate from localStorage on client mount for instant render
  useEffect(() => {
    try {
      const item = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (item) {
        const cached = JSON.parse(item);
        if (cached) {
          if (cached.summary) setSummary(cached.summary);
          if (typeof cached.dailySpent === "number") setDailySpent(cached.dailySpent);
          if (typeof cached.dailyCount === "number") setDailyCount(cached.dailyCount);
          if (typeof cached.totalCount === "number") setTotalCount(cached.totalCount);
          if (typeof cached.pendingCount === "number") setPendingCount(cached.pendingCount);
          if (cached.transactions) setTransactions(cached.transactions);
          setIsLoading(false);
        }
      }
    } catch {}
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
          getExpenses({ page: 1, limit: 10 }, true).catch(() => null),
          getDailyExpenses({ limit: 100, forceRefresh: true }).catch(() => null),
          fetchChart(selectedYear, selectedMonth, isManualRefresh),
        ]);

        let currentDailySpent = 0;
        let currentDailyCount = 0;
        let liveTransactions: Transaction[] = [];

        if (dailyRes) {
          const rawRes = dailyRes as any;
          const dailyItems: any[] = Array.isArray(rawRes?.items)
            ? rawRes.items
            : Array.isArray(rawRes?.data)
            ? rawRes.data
            : Array.isArray(rawRes)
            ? rawRes
            : [];

          if (dailyItems.length > 0) {
            const approvedRoomItems = dailyItems.filter(
              (i: any) =>
                (i.expense_type === "room" || i.category === "room") &&
                i.status === "APPROVED"
            );
            currentDailySpent = approvedRoomItems.reduce(
              (sum: number, i: any) => sum + (Number(i.amount) || 0),
              0
            );
            currentDailyCount = approvedRoomItems.length;

            // Map real transactions from backend
            liveTransactions = dailyItems.slice(0, 10).map((item, idx) => {
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
              } else if (rawCat.includes("BILL") || rawCat.includes("ELECTRIC") || rawCat.includes("WATER")) {
                catName = "Utilities";
                color = "text-pink-700 dark:text-pink-300";
                bg = "bg-pink-500/15 border-pink-500/30";
              }

              const userName = item.user?.name || item.paid_by?.name || "Member";
              const initials = userName
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
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                paidBy: { name: userName, initials },
                type: item.expense_type === "room" ? "room" : "personal",
                status: (item.status?.toUpperCase() || "APPROVED") as ExpenseStatus,
              };
            });
          } else if (dailyRes.summary) {
            currentDailySpent =
              Number(
                dailyRes.summary.approvedRoomAmount ??
                dailyRes.summary.totalRoomAmount
              ) || 0;
            currentDailyCount = Number(dailyRes.summary.approvedCount) || 0;
          }

          setDailySpent(currentDailySpent);
          setDailyCount(currentDailyCount);
          if (liveTransactions.length > 0) {
            setTransactions(liveTransactions);
          }
        }

        // Room Expenses Summary
        if (roomData) {
          let items: Expense[] = [];
          if (Array.isArray(roomData)) items = roomData;
          else if (Array.isArray(roomData.items)) items = roomData.items;
          else if (Array.isArray(roomData.expenses)) items = roomData.expenses;
          else if (Array.isArray(roomData.data)) items = roomData.data;

          const total =
            typeof roomData.meta?.total === "number"
              ? roomData.meta.total
              : typeof roomData.total === "number"
              ? roomData.total
              : items.length;

          setTotalCount(total);

          const pending = items.filter(
            (e) =>
              e.status === "PENDING" ||
              e.payments?.some((p) => p.status === "PENDING")
          ).length;
          setPendingCount(pending);

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

          if (roomData.summary) {
            const rawPending =
              Number(
                roomData.summary.totalPending ??
                roomData.summary.totalPendingAmount
              ) || 0;

            newSummary = {
              totalRoomRate:
                Number(
                  roomData.summary.totalRoomRate ??
                  roomData.summary.totalRoomRateAmount
                ) || 0,
              totalApproved:
                Number(
                  roomData.summary.totalApproved ??
                  roomData.summary.totalApprovedAmount
                ) || 0,
              totalPending: rawPending + additionalPendingInstallments,
              totalRemaining:
                Number(
                  roomData.summary.totalRemaining ??
                  roomData.summary.totalRemainingAmount
                ) || 0,
            };
          } else {
            let roomRate = 0;
            let approved = 0;
            let pend = 0;
            let rem = 0;
            items.forEach((item) => {
              if (item.status === "COMPLETE" || item.status === "REMAINING") {
                roomRate += Number(item.total_amount) || 0;
                rem += Number(item.remaining_amount) || 0;
              }
              approved += Number(item.paid_amount) || 0;
              if (item.status === "PENDING") {
                pend += Number(item.pay_amount) || 0;
              } else {
                const pendingP = item.payments?.find((p) => p.status === "PENDING");
                if (pendingP) pend += Number(pendingP.amount) || 0;
              }
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

          // Cache locally
          try {
            localStorage.setItem(
              DASHBOARD_CACHE_KEY,
              JSON.stringify({
                summary: newSummary,
                dailySpent: currentDailySpent,
                dailyCount: currentDailyCount,
                totalCount: total,
                pendingCount: pending,
                transactions: liveTransactions,
                timestamp: Date.now(),
              })
            );
          } catch {}
        }
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
      window.addEventListener("khatabook_data_updated", handleDataUpdated);
      return () => {
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

  // User formula: Total Approved Paid - Total Daily Expenses = Total Room Rate
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

  // Extract dynamic sparkline series from real daily trend
  const sparklineRoom = useMemo(() => {
    const trend = chartData?.dailyTrend || [];
    if (trend.length === 0) return [0, netRoomRate];
    const pts = trend.slice(-7).map((d) => d.room);
    return pts.length >= 2 ? pts : [0, netRoomRate];
  }, [chartData, netRoomRate]);

  const sparklineDaily = useMemo(() => {
    const trend = chartData?.dailyTrend || [];
    if (trend.length === 0) return [0, dailySpent];
    const pts = trend.slice(-7).map((d) => d.total);
    return pts.length >= 2 ? pts : [0, dailySpent];
  }, [chartData, dailySpent]);

  const sparklineApproved = useMemo(() => {
    const monthly = chartData?.monthlyTrend || [];
    if (monthly.length === 0) return [0, summary.totalApproved];
    const pts = monthly.slice(-7).map((m) => m.total);
    return pts.length >= 2 ? pts : [0, summary.totalApproved];
  }, [chartData, summary.totalApproved]);

  const sparklinePending = useMemo(() => {
    return [summary.totalPending, summary.totalPending];
  }, [summary.totalPending]);

  const sparklineRemaining = useMemo(() => {
    return [summary.totalRemaining, summary.totalRemaining];
  }, [summary.totalRemaining]);

  // 5 KPI Stat Cards with real live data
  const kpiCards = [
    {
      title: "Total Room Rate",
      value: netRoomRate,
      subtitle:
        dailySpent > 0
          ? `Cut by ${formatINR(dailySpent)} groceries`
          : `${totalCount} room contracts`,
      icon: Home,
      variant: "blue" as const,
      sparklineData: sparklineRoom,
    },
    {
      title: "Total Daily Expenses",
      value: dailySpent,
      subtitle: `${dailyCount} approved grocery items`,
      icon: ShoppingBag,
      variant: "violet" as const,
      sparklineData: sparklineDaily,
    },
    {
      title: "Total Approved Paid",
      value: summary.totalApproved,
      subtitle: `${collectionRate}% of total collected`,
      icon: CheckCircle2,
      variant: "emerald" as const,
      sparklineData: sparklineApproved,
    },
    {
      title: "Total Pending Approval",
      value: summary.totalPending,
      subtitle: `${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting review`,
      icon: Clock,
      variant: "amber" as const,
      sparklineData: sparklinePending,
    },
    {
      title: "Total Remaining Due",
      value: summary.totalRemaining,
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
      return Number(chartData?.summary?.monthTotal) || dailySpent;
    }
    return Number(chartData?.summary?.yearTotal) || dailySpent;
  }, [chartData, viewMode, dailySpent]);

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Dashboard Overview
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Welcome back, <span className="font-semibold text-foreground">{userName}</span>! Here is the live summary of room rate expenses, counts, and payments.
            </p>
          </div>
        </div>

        {/* Right Action Controls: Refresh & Room Expenses Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            title="Refresh live metrics from backend"
            aria-label="Refresh dashboard metrics"
            className="h-10 w-10 rounded-xl glass-pill shadow-xs hover:border-violet-500/40"
          >
            <RotateCw
              className={`h-4 w-4 text-muted-foreground hover:text-foreground ${
                isRefreshing ? "animate-spin text-violet-600" : ""
              }`}
            />
          </Button>

          <Button
            asChild
            className="h-10 px-4 rounded-xl gap-2 font-bold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/expenses">
              <PlusCircle className="h-4 w-4 shrink-0" />
              <span>Room Expenses</span>
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
        <RecentTransactions transactions={transactions} isLoading={isLoading} />
      </motion.div>
    </div>
  );
}
