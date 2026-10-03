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
  ArrowRight,
  PlusCircle,
  Inbox,
  User as UserIcon,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getExpenses } from "@/lib/expense-api";
import { Expense } from "@/types/expense";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseStatusBadge } from "@/components/expenses/expense-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [summary, setSummary] = useState({
    totalRoomRate: 0,
    totalApproved: 0,
    totalPending: 0,
    totalRemaining: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await getExpenses({ page: 1, limit: 10 });
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

        // Summary totals
        if (data.summary) {
          const rawPending =
            Number(
              data.summary.totalPending ?? data.summary.totalPendingAmount
            ) || 0;

          setSummary({
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
          });
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

          setSummary({
            totalRoomRate: roomRate,
            totalApproved: approved,
            totalPending: pend,
            totalRemaining: rem,
          });
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

  const collectionRate =
    summary.totalRoomRate > 0
      ? Math.min(
          100,
          Math.round((summary.totalApproved / summary.totalRoomRate) * 100)
        )
      : 0;

  const statCards = [
    {
      title: "Total Room Rate",
      value: formatCurrency(summary.totalRoomRate),
      subtitle: `${totalCount} total expense request${totalCount === 1 ? "" : "s"}`,
      icon: Home,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      accent: "from-blue-500/10 to-transparent",
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
            disabled={isLoading || isRefreshing}
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

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {isLoading ? "..." : stat.value}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{stat.subtitle}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Room Expense Requests Activity */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div>
            <CardTitle className="text-base font-bold">
              Recent Room Rate Expense Requests
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Latest requests submitted by members across the platform.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium">
            <Link href="/expenses">
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="text-xs text-muted-foreground">Loading recent expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                No expense requests found
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                No room rate payment requests have been submitted yet.
              </p>
              <Button asChild size="sm" className="mt-4 gap-1.5 text-xs font-semibold">
                <Link href="/expenses">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Create First Expense Request</span>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Purpose / Note</th>
                    <th className="px-4 py-3">Room Rent</th>
                    <th className="px-4 py-3">Requested Pay</th>
                    <th className="px-4 py-3">Approved Paid</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {expenses.slice(0, 5).map((expense) => {
                    const total = Number(expense.total_amount) || 0;
                    const pay = Number(expense.pay_amount) || 0;
                    const paid = Number(expense.paid_amount) || 0;
                    const remaining = Number(expense.remaining_amount) || 0;

                    return (
                      <tr
                        key={expense.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* User name & avatar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                              {expense.user?.name?.charAt(0).toUpperCase() || (
                                <UserIcon className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate max-w-[120px]">
                                {expense.user?.name || "Unknown"}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {expense.user?.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Note */}
                        <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">
                          {expense.note || "room pay"}
                        </td>

                        {/* Room Rent */}
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(total)}
                        </td>

                        {/* Requested Pay */}
                        <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                          {formatCurrency(pay)}
                        </td>

                        {/* Approved Paid */}
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(paid)}
                        </td>

                        {/* Remaining */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              remaining > 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatCurrency(remaining)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ExpenseStatusBadge status={expense.status} />
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-[11px]">
                          {formatDate(expense.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
