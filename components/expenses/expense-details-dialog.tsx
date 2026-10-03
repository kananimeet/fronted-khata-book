"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types/expense";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseStatusBadge, PaymentStatusBadge } from "./expense-status-badge";
import {
  Receipt,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  Layers,
} from "lucide-react";

interface ExpenseDetailsDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  onApprove?: (expense: Expense) => void;
  onReject?: (expense: Expense) => void;
  onPayRemaining?: (expense: Expense) => void;
  canPayRemaining?: boolean;
}

export function ExpenseDetailsDialog({
  expense,
  open,
  onOpenChange,
  isAdmin = false,
  onApprove,
  onReject,
  onPayRemaining,
  canPayRemaining = false,
}: ExpenseDetailsDialogProps) {
  if (!expense) return null;

  const total = Number(expense.total_amount) || 0;
  const paid = Number(expense.paid_amount) || 0;
  const remaining = Number(expense.remaining_amount) || 0;
  const pay = Number(expense.pay_amount) || 0;

  const payments = expense.payments || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Expense Request Details
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Created on {formatDate(expense.created_at)}
                </DialogDescription>
              </div>
            </div>
            <ExpenseStatusBadge status={expense.status} />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* User info if available */}
          {expense.user && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {expense.user.name?.charAt(0).toUpperCase() || <UserIcon className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">
                  {expense.user.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {expense.user.email} {expense.user.mobile ? `• ${expense.user.mobile}` : ""}
                </div>
              </div>
            </div>
          )}

          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-border bg-card">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Total Room Rate
              </div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {formatCurrency(total)}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Requested Pay
              </div>
              <div className="text-base font-bold text-primary mt-0.5">
                {formatCurrency(pay)}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Approved Total
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(paid)}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Remaining Due
              </div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  remaining > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(remaining)}
              </div>
            </div>
          </div>

          {/* Notes & Admin Remarks */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Purpose / Note:</span>
              </div>
              <p className="text-foreground text-xs leading-relaxed">
                {expense.note || "No specific note provided."}
              </p>
            </div>

            {expense.admin_note && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Admin Remarks:</span>
                </div>
                <p className="text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                  {expense.admin_note}
                </p>
              </div>
            )}
          </div>

          {/* Installment History Timeline */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <Layers className="h-4 w-4 text-primary" />
                <span>Installment Payment Requests ({payments.length})</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Total Approved: {formatCurrency(paid)}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No installment records found.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <span>{formatCurrency(p.amount)}</span>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.note || `Installment #${idx + 1}`} • {formatDate(p.created_at)}
                      </div>
                      {p.admin_note && (
                        <div className="text-[10px] text-primary italic">
                          Remark: {p.admin_note}
                        </div>
                      )}
                    </div>

                    {/* Admin Quick Action for Pending Installment */}
                    {isAdmin && p.status === "PENDING" && onApprove && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onOpenChange(false);
                            onApprove(expense);
                          }}
                          className="h-7 text-xs font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="Approve this installment request"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        {onReject && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onOpenChange(false);
                              onReject(expense);
                            }}
                            className="h-7 text-xs font-semibold text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Reject this installment request"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Buttons */}
        {(() => {
          const pendingPayment = payments.find((p) => p.status === "PENDING");
          const hasPendingPayment =
            expense.status === "PENDING" || Boolean(pendingPayment);

          if (isAdmin && hasPendingPayment) {
            return (
              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <span className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                  <Clock className="h-4 w-4 animate-spin" />
                  Installment request awaiting admin approval
                </span>
                <div className="flex items-center gap-2">
                  {onReject && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        onReject(expense);
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  )}
                  {onApprove && (
                    <Button
                      onClick={() => {
                        onOpenChange(false);
                        onApprove(expense);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve Payment ({formatCurrency(pendingPayment?.amount ?? pay)})
                    </Button>
                  )}
                </div>
              </div>
            );
          }

          if (!isAdmin && hasPendingPayment) {
            return (
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                  <Clock className="h-4 w-4 animate-spin" />
                  Your payment request of {formatCurrency(pendingPayment?.amount ?? pay)} is pending admin approval.
                </span>
              </div>
            );
          }

          if (canPayRemaining && remaining > 0 && onPayRemaining) {
            return (
              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onPayRemaining(expense);
                  }}
                  className="gap-2 font-semibold shadow-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay Remaining ({formatCurrency(remaining)})
                </Button>
              </div>
            );
          }

          return null;
        })()}
      </DialogContent>
    </Dialog>
  );
}
