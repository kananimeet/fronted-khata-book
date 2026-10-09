"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Inbox,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Transaction, ExpenseStatus } from "@/lib/mock-data";

interface RecentTransactionsProps {
  transactions?: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({
  transactions = [],
  isLoading = false,
}: RecentTransactionsProps) {
  const [filter, setFilter] = useState<"ALL" | ExpenseStatus>("ALL");

  const filtered = transactions.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  const getStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 shadow-xl border border-white/60 dark:border-white/10">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Recent Transactions
            </h3>
            <p className="text-xs text-muted-foreground">
              Live log of daily groceries and room bill settlements
            </p>
          </div>
        </div>

        {/* Filter Pills & View All Link */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 rounded-xl bg-muted/60 border border-border/60 text-xs">
            {(["ALL", "APPROVED", "PENDING"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] cursor-pointer",
                  filter === status
                    ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {status === "ALL"
                  ? "All"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 h-8 gap-1 font-semibold"
          >
            <Link href="/daily-expenses">
              <span>View all</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Responsive Table / List View */}
      <div className="overflow-x-auto mt-2">
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-1.5">
            <Inbox className="h-8 w-8 text-muted-foreground/40 mb-1" />
            <p className="font-semibold text-foreground/80">No Transactions Found</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              {filter !== "ALL"
                ? `No ${filter.toLowerCase()} transactions available in the database.`
                : "No live expenses or payments have been logged yet."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-3">Item / Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Paid By</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className="group hover:bg-muted/40 transition-colors"
                >
                  {/* Item description */}
                  <td className="py-3 px-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {tx.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {tx.type}
                      </span>
                    </div>
                  </td>

                  {/* Category Chip */}
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        tx.categoryColor,
                        tx.categoryBg
                      )}
                    >
                      {tx.category}
                    </span>
                  </td>

                  {/* Paid By Avatar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 ring-1 ring-border">
                        <AvatarFallback className="bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold">
                          {tx.paidBy.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground font-medium">
                        {tx.paidBy.name}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3 text-xs text-muted-foreground">
                    {tx.date}
                  </td>

                  {/* Amount (JetBrains Mono) */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                    {formatINR(tx.amount)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-right">
                    {getStatusBadge(tx.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
