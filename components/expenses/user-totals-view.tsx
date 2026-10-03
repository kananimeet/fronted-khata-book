"use client";

import React, { useState } from "react";
import { UserExpenseTotalsItem, GrandSummary, Expense } from "@/types/expense";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseStatusBadge } from "./expense-status-badge";
import { ExpenseStats } from "./expense-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  RotateCw,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Phone,
  Mail,
  Receipt,
  Layers,
  CheckCircle2,
  Clock,
  X,
  Filter,
} from "lucide-react";

interface UserTotalsViewProps {
  users: UserExpenseTotalsItem[];
  grandSummary: GrandSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  onViewExpense?: (expense: Expense) => void;
  onApproveExpense?: (expense: Expense) => void;
  onRejectExpense?: (expense: Expense) => void;
}

export function UserTotalsView({
  users,
  grandSummary,
  isLoading,
  onRefresh,
  onViewExpense,
  onApproveExpense,
  onRejectExpense,
}: UserTotalsViewProps) {
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (userId: string) => {
    setExpandedUserIds((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filter users client-side
  const filteredUsers = users.filter((item) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.user.name?.toLowerCase().includes(q) ||
      item.user.email?.toLowerCase().includes(q) ||
      item.user.mobile?.includes(q);

    const matchesStatus =
      statusFilter === "ALL" || item.status?.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 4 Grand Summary KPI Cards */}
      <ExpenseStats
        totalRoomRate={grandSummary?.grandTotalRoomRate ?? 0}
        totalApproved={grandSummary?.grandTotalApproved ?? 0}
        totalPending={grandSummary?.grandTotalPending ?? 0}
        totalRemaining={grandSummary?.grandTotalRemaining ?? 0}
        totalUsers={grandSummary?.totalUsers ?? users.length}
        titlePrefix="Grand Total"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search users by name, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background pl-9 pr-8 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="PENDING">PENDING</option>
              <option value="REMAINING">REMAINING</option>
              <option value="COMPLETE">COMPLETE</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh User Totals"
            className="h-9 w-9"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* User Financial Cards / Expandable Rows */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3 shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="text-xs text-muted-foreground">Loading user totals dashboard...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground shadow-xs">
          <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-foreground">No users found</p>
          <p className="text-xs mt-1">Try adjusting your search or status filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((item) => {
            const isExpanded = !!expandedUserIds[item.user.id];
            const requests = item.requests || [];

            return (
              <div
                key={item.user.id}
                className="rounded-xl border border-border bg-card shadow-xs overflow-hidden transition-all duration-200 hover:border-primary/30"
              >
                {/* Main User Card Header */}
                <div
                  onClick={() => toggleExpand(item.user.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-card hover:bg-muted/30 transition-colors"
                >
                  {/* User Profile */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0 border border-primary/20">
                      {item.user.name?.charAt(0).toUpperCase() || (
                        <UserIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">
                          {item.user.name}
                        </span>
                        <ExpenseStatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {item.user.email}
                        </span>
                        {item.user.mobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {item.user.mobile}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial KPI Numbers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-xs text-left">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Room Rate
                      </div>
                      <div className="text-sm font-bold text-foreground mt-0.5">
                        {formatCurrency(item.total_amount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Total Approved
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(item.total ?? item.total_approved)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Total Pending
                      </div>
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {formatCurrency(item.total_pending)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Remaining Due
                      </div>
                      <div
                        className={`text-sm font-bold mt-0.5 ${
                          item.total_remaining > 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(item.total_remaining)}
                      </div>
                    </div>
                  </div>

                  {/* Expand Chevron */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <span className="text-xs text-muted-foreground">
                      {requests.length} {requests.length === 1 ? "request" : "requests"}
                    </span>
                    <div className="p-1 rounded-md text-muted-foreground hover:bg-muted">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Accordion: Individual Requests & Installments */}
                {isExpanded && (
                  <div className="border-t border-border/80 bg-muted/20 p-4 sm:p-5 space-y-3 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-primary" />
                        Requests Breakdown for {item.user.name}
                      </span>
                    </div>

                    {requests.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                        No individual request records found for this user.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {requests.map((req, rIdx) => {
                          const rTotal = Number(req.total_amount) || 0;
                          const rPay = Number(req.pay_amount) || 0;
                          const rPaid = Number(req.paid_amount) || 0;
                          const rRem = Number(req.remaining_amount) || 0;

                          return (
                            <div
                              key={req.id || rIdx}
                              className="rounded-lg border border-border bg-card p-3.5 space-y-2 text-xs hover:border-primary/40 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">
                                      {req.note || "room pay"}
                                    </span>
                                    <ExpenseStatusBadge status={req.status} />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    Submitted: {formatDate(req.created_at)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 text-right">
                                  <div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Room Rate
                                    </div>
                                    <div className="font-semibold">{formatCurrency(rTotal)}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Req Pay
                                    </div>
                                    <div className="font-semibold text-primary">
                                      {formatCurrency(rPay)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Approved
                                    </div>
                                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(rPaid)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Remaining
                                    </div>
                                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                                      {formatCurrency(rRem)}
                                    </div>
                                  </div>

                                  {/* Quick Action in Expandable View */}
                                  {req.status === "PENDING" && onApproveExpense && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[11px] gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                      onClick={() => onApproveExpense(req)}
                                    >
                                      <CheckCircle2 className="h-3 w-3" /> Approve
                                    </Button>
                                  )}

                                  {onViewExpense && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-[11px]"
                                      onClick={() => onViewExpense(req)}
                                    >
                                      View Details
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
