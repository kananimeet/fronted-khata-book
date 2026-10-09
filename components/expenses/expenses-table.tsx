"use client";

import React from "react";
import { Expense } from "@/types/expense";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseStatusBadge } from "./expense-status-badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Eye,
  Clock,
  Inbox,
  User as UserIcon,
} from "lucide-react";

interface ExpensesTableProps {
  expenses: Expense[];
  isLoading: boolean;
  isAdmin: boolean;
  currentUserId?: string | number;
  onPayRemaining: (expense: Expense) => void;
  onViewDetails: (expense: Expense) => void;
  onApprove: (expense: Expense) => void;
  onReject: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpensesTable({
  expenses,
  isLoading,
  isAdmin,
  currentUserId,
  onPayRemaining,
  onViewDetails,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl border border-white/60 dark:border-white/10 overflow-hidden shadow-xl">
        <div className="p-12 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent" />
          <p className="text-xs text-muted-foreground font-medium">Loading expense requests...</p>
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center glass-card shadow-lg">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-400 mb-3 border border-violet-500/20">
          <Inbox className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          No expense requests found
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          {isAdmin
            ? "No expense payment records match your active search filters."
            : "You have not submitted any room rate expense payment requests yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl shadow-xl border border-white/60 dark:border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-3.5">User</th>
              <th className="px-4 py-3.5">Purpose / Note</th>
              <th className="px-4 py-3.5">Room Rent</th>
              <th className="px-4 py-3.5">Requested Pay</th>
              <th className="px-4 py-3.5">Approved Paid</th>
              <th className="px-4 py-3.5">Remaining</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {expenses.map((expense) => {
              const total = Number(expense.total_amount) || 0;
              const pay = Number(expense.pay_amount) || 0;
              const paid = Number(expense.paid_amount) || 0;
              const remaining = Number(expense.remaining_amount) || 0;

              // Check if there is an active pending installment payment waiting for admin approval
              const pendingPayment = expense.payments?.find(
                (p) => p.status === "PENDING"
              );
              const hasPendingPayment =
                expense.status === "PENDING" || Boolean(pendingPayment);
              const pendingAmount = pendingPayment?.amount
                ? Number(pendingPayment.amount)
                : expense.status === "PENDING"
                ? pay
                : 0;

              // Non-admin user can ONLY pay remaining for their OWN expense record
              const isOwner =
                Boolean(currentUserId) &&
                String(expense.user_id) === String(currentUserId);

              const canPay =
                !isAdmin &&
                isOwner &&
                expense.status === "REMAINING" &&
                remaining > 0;

              return (
                <tr
                  key={expense.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* User info (Visible to all: Members & Admin) */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                        {expense.user?.name?.charAt(0).toUpperCase() || (
                          <UserIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate max-w-[130px]">
                          {expense.user?.name || "Unknown"}
                          {isOwner && (
                            <span className="ml-1.5 text-[10px] text-primary font-normal bg-primary/10 px-1 py-0.2 rounded">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                          {expense.user?.email || ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Note */}
                  <td className="px-4 py-3.5 font-medium text-foreground max-w-[180px]">
                    <div className="truncate font-semibold">{expense.note || "room pay"}</div>
                    {expense.admin_note && (
                      <div className="text-[10px] text-primary italic truncate">
                        Admin: {expense.admin_note}
                      </div>
                    )}
                  </td>

                  {/* Room Rent Total */}
                  <td className="px-4 py-3.5 font-semibold text-foreground whitespace-nowrap">
                    {formatCurrency(total)}
                  </td>

                  {/* Requested Pay Amount */}
                  <td className="px-4 py-3.5 font-semibold text-primary whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{formatCurrency(pay)}</span>
                      {hasPendingPayment && expense.status === "REMAINING" && (
                        <span className="text-[10px] text-amber-500 font-semibold">
                          Installment Req
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Approved Paid Total */}
                  <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(paid)}
                  </td>

                  {/* Remaining Balance */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        remaining > 0
                          ? "text-blue-600 dark:text-blue-400 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(remaining)}
                    </span>
                  </td>

                  {/* Status Badge with required colors & pending installment indicator */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <ExpenseStatusBadge status={expense.status} />
                      {hasPendingPayment && expense.status === "REMAINING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <Clock className="h-3 w-3 animate-spin" />
                          Pending Approval ({formatCurrency(pendingAmount || pay)})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap text-[11px]">
                    {formatDate(expense.created_at)}
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* USER ACTION: Pay Remaining Button or Pending state */}
                      {!isAdmin && canPay && (
                        <div>
                          {hasPendingPayment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                              <Clock className="h-3.5 w-3.5 animate-spin" />
                              <span>Awaiting Approval ({formatCurrency(pendingAmount || pay)})</span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => onPayRemaining(expense)}
                              className="h-8 gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-transform active:scale-95"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Pay Remaining ({formatCurrency(remaining)})</span>
                            </Button>
                          )}
                        </div>
                      )}

                      {/* View Details Button (All Roles) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onViewDetails(expense)}
                        title="View details & history"
                        aria-label="View details & history"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* ADMIN ACTIONS: Approve / Reject / Edit / Delete */}
                      {isAdmin && (
                        <>
                          {hasPendingPayment && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                onClick={() => onApprove(expense)}
                                title={
                                  expense.status === "REMAINING"
                                    ? `Approve Installment (${formatCurrency(pendingAmount || pay)})`
                                    : "Approve Request"
                                }
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Approve</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs font-semibold text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                                onClick={() => onReject(expense)}
                                title="Reject Request"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onEdit(expense)}
                            title="Edit expense details"
                            aria-label="Edit expense details"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(expense)}
                            title="Delete expense"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
