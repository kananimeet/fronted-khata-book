"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Expense } from "@/types/expense";
import { approveExpense } from "@/lib/expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

interface ExpenseApproveDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: () => void;
}

export function ExpenseApproveDialog({
  expense,
  open,
  onOpenChange,
  onApproved,
}: ExpenseApproveDialogProps) {
  const { toast } = useToast();

  const [remarks, setRemarks] = useState<string>("Payment verified via UPI");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!expense) return null;

  const total = Number(expense.total_amount) || 0;
  const currentPaid = Number(expense.paid_amount) || 0;
  const pendingPayment = expense.payments?.find((p) => p.status === "PENDING");
  const pay = pendingPayment ? Number(pendingPayment.amount) : Number(expense.pay_amount) || 0;
  const projectedPaid = currentPaid + pay;
  const projectedRemaining = Math.max(0, total - projectedPaid);
  const nextStatus = projectedRemaining === 0 ? "COMPLETE" : "REMAINING";

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await approveExpense(expense.id, {
        admin_note: remarks.trim(),
        remarks: remarks.trim(),
      });

      toast.success(
        `Expense request approved! Status updated to ${nextStatus}.`
      );
      onOpenChange(false);
      onApproved();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to approve expense request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleApprove}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Approve Payment Request
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Review and confirm approval for this expense payment.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User & Request Summary */}
            <div className="rounded-xl border border-border p-3.5 bg-card space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">User:</span>
                <span className="font-semibold text-foreground">
                  {expense.user?.name || "Member"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Room Rent:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Payment to Approve:</span>
                <span className="font-bold text-primary text-sm">
                  {formatCurrency(pay)}
                </span>
              </div>
            </div>

            {/* Approval Impact Preview */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-900/60 p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Financial Status After Approval</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Approved Total
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                    <span>{formatCurrency(currentPaid)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{formatCurrency(projectedPaid)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    New Status
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {nextStatus}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Note / Remarks */}
            <div className="space-y-1.5">
              <Label htmlFor="approve_remarks" className="text-xs font-semibold">
                Approval Remarks / Verification Note
              </Label>
              <Input
                id="approve_remarks"
                type="text"
                placeholder="e.g. Payment verified via UPI / Bank transfer"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                `Confirm Approval (${formatCurrency(pay)})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
