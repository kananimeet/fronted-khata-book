"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { DailyExpense } from "@/types/daily-expense";
import {
  approveDailyExpense,
  rejectDailyExpense,
} from "@/lib/daily-expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "./category-badge";
import {
  CheckCircle2,
  XCircle,
  Home,
  User as UserIcon,
  AlertTriangle,
  Loader2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyExpenseActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: DailyExpense | null;
  actionType: "approve" | "reject";
  onSuccess: (updatedExpense: DailyExpense) => void;
}

export function DailyExpenseActionDialog({
  open,
  onOpenChange,
  expense,
  actionType,
  onSuccess,
}: DailyExpenseActionDialogProps) {
  const { toast } = useToast();
  const [adminNote, setAdminNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setAdminNote("");
    }
  }, [open]);

  if (!expense) return null;

  const isApprove = actionType === "approve";
  const isRoomExpense = expense.expense_type === "room";
  const userName = expense.user?.name || "Roommate";

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      let updated: DailyExpense;
      if (isApprove) {
        updated = await approveDailyExpense(expense.id, adminNote);
        toast.success(
          isRoomExpense
            ? `Approved! ₹${expense.amount} credited towards ${userName}'s room rent liability.`
            : `Personal expense of ₹${expense.amount} approved!`
        );
      } else {
        updated = await rejectDailyExpense(expense.id, adminNote);
        toast.error(`Expense request of ₹${expense.amount} rejected.`);
      }

      onSuccess(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(
          err,
          `Failed to ${isApprove ? "approve" : "reject"} expense. Please try again.`
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header with color accent */}
        <DialogHeader
          className={cn(
            "p-5 pb-4 border-b border-border/80 shrink-0",
            isApprove
              ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
              : "bg-destructive/10 text-destructive-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl border shadow-xs shrink-0",
                isApprove
                  ? "bg-emerald-600 text-white border-emerald-500/30"
                  : "bg-destructive text-destructive-foreground border-destructive/30"
              )}
            >
              {isApprove ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {isApprove
                  ? "Approve Daily Expense"
                  : "Reject Daily Expense"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isApprove
                  ? "Confirm and adjust records accordingly."
                  : "Decline this expense request with an optional remark."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content details */}
        <div className="p-5 space-y-4 text-xs">
          {/* Expense snapshot summary card */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Requested By:</span>
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                {userName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Expense Amount:</span>
              <span className="font-mono font-bold text-foreground text-base">
                {formatCurrency(expense.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Type & Category:</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                    isRoomExpense
                      ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                      : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  )}
                >
                  {isRoomExpense ? (
                    <Home className="h-3 w-3" />
                  ) : (
                    <UserIcon className="h-3 w-3" />
                  )}
                  {isRoomExpense ? "Room" : "Personal"}
                </span>
                <CategoryBadge category={expense.category} size="sm" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Date:</span>
              <span className="text-foreground font-medium">
                {formatDate(expense.expense_date)}
              </span>
            </div>

            {expense.note && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-muted-foreground text-[11px] font-medium">
                  Note:
                </p>
                <p className="text-foreground text-xs italic mt-0.5">
                  &ldquo;{expense.note}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Special Rent Reduction Notice for Room Expenses */}
          {isApprove && isRoomExpense && (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">
                  Monthly Room Rent Liability Adjustment
                </p>
                <p className="text-[11px] text-muted-foreground dark:text-emerald-300/80 mt-0.5">
                  Approving this will recognize ₹{expense.amount} as a shared
                  room expense, lowering {userName}&apos;s remaining room rent
                  obligation.
                </p>
              </div>
            </div>
          )}

          {/* Rejection Warning Notice */}
          {!isApprove && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Rejecting Expense</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  This expense will not be counted towards room rent reduction.
                  Please state a reason below so the user can rectify it.
                </p>
              </div>
            </div>
          )}

          {/* Admin Note Input */}
          <div className="space-y-1.5">
            <Label htmlFor="admin_note" className="text-xs font-semibold">
              Admin Remark / Note (Optional)
            </Label>
            <textarea
              id="admin_note"
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                isApprove
                  ? "e.g. Bill verified and approved for rent credit."
                  : "e.g. Bill receipt image is blurry; please re-upload."
              }
              className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="text-xs h-8"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn(
              "text-xs font-semibold h-8 min-w-[110px] shadow-xs text-white",
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-destructive hover:bg-destructive/90"
            )}
          >
            {isProcessing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </span>
            ) : isApprove ? (
              "Approve Expense"
            ) : (
              "Reject Expense"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
