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
import { rejectExpense } from "@/lib/expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { XCircle, Loader2 } from "lucide-react";

interface ExpenseRejectDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejected: () => void;
}

export function ExpenseRejectDialog({
  expense,
  open,
  onOpenChange,
  onRejected,
}: ExpenseRejectDialogProps) {
  const { toast } = useToast();

  const [reason, setReason] = useState<string>("Payment not received or invalid reference");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!expense) return null;

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await rejectExpense(expense.id, {
        reason: reason.trim(),
        remarks: reason.trim(),
      });

      toast.success("Expense request rejected.");
      onOpenChange(false);
      onRejected();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to reject expense request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleReject}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Reject Request
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Provide a reason for rejecting this payment request.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-border p-3 bg-card space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-semibold text-foreground">
                  {expense.user?.name || "Member"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested Pay Amount:</span>
                <span className="font-semibold text-destructive">
                  {formatCurrency(expense.pay_amount)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reject_reason" className="text-xs font-semibold">
                Reason for Rejection <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reject_reason"
                type="text"
                required
                placeholder="e.g. Transaction ID invalid or not received"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
              variant="destructive"
              disabled={isSubmitting || !reason.trim()}
              className="gap-2 font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
