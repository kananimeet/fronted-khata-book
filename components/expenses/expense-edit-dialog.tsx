"use client";

import React, { useState, useEffect } from "react";
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
import { Expense, ExpenseStatus } from "@/types/expense";
import { updateExpense } from "@/lib/expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Edit3, Loader2, RefreshCw } from "lucide-react";

interface ExpenseEditDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function ExpenseEditDialog({
  expense,
  open,
  onOpenChange,
  onUpdated,
}: ExpenseEditDialogProps) {
  const { toast } = useToast();

  const [totalAmount, setTotalAmount] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [remainingAmount, setRemainingAmount] = useState<string>("");
  const [status, setStatus] = useState<ExpenseStatus>("PENDING");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (open && expense) {
      setTotalAmount(String(expense.total_amount ?? ""));
      setPayAmount(String(expense.pay_amount ?? ""));
      setPaidAmount(String(expense.paid_amount ?? ""));
      setRemainingAmount(String(expense.remaining_amount ?? ""));
      setStatus(expense.status || "PENDING");
      setNote(expense.note || "");
    }
  }, [open, expense]);

  if (!expense) return null;

  // Auto-recalculate remaining when total or paid changes
  const handleRecalculateRemaining = () => {
    const tot = Number(totalAmount) || 0;
    const pd = Number(paidAmount) || 0;
    const rem = Math.max(0, tot - pd);
    setRemainingAmount(String(rem));

    if (rem === 0 && pd > 0) {
      setStatus("COMPLETE");
    } else if (pd > 0 && rem > 0) {
      setStatus("REMAINING");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateExpense(expense.id, {
        total_amount: Number(totalAmount),
        pay_amount: Number(payAmount),
        paid_amount: Number(paidAmount),
        remaining_amount: Number(remainingAmount),
        status,
        note: note.trim(),
      });

      toast.success("Expense details updated successfully.");
      onOpenChange(false);
      onUpdated();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to update expense."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Edit Expense Request (Admin)
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Update financial amounts, status, and notes for user {expense.user?.name || ""}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              {/* Total Room Rent */}
              <div className="space-y-1">
                <Label htmlFor="edit_total" className="text-xs font-semibold">
                  Total Room Rent (₹)
                </Label>
                <Input
                  id="edit_total"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>

              {/* Pay Amount (Current Requested) */}
              <div className="space-y-1">
                <Label htmlFor="edit_pay" className="text-xs font-semibold">
                  Requested Pay (₹)
                </Label>
                <Input
                  id="edit_pay"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Approved Paid Amount */}
              <div className="space-y-1">
                <Label htmlFor="edit_paid" className="text-xs font-semibold">
                  Approved Paid (₹)
                </Label>
                <Input
                  id="edit_paid"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>

              {/* Remaining Balance */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit_remaining" className="text-xs font-semibold">
                    Remaining (₹)
                  </Label>
                  <button
                    type="button"
                    onClick={handleRecalculateRemaining}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    title="Auto calculate Total - Paid"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> Auto Calc
                  </button>
                </div>
                <Input
                  id="edit_remaining"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={remainingAmount}
                  onChange={(e) => setRemainingAmount(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1">
              <Label htmlFor="edit_status" className="text-xs font-semibold">
                Status
              </Label>
              <select
                id="edit_status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all cursor-pointer"
              >
                <option value="PENDING">PENDING (Yellow)</option>
                <option value="REMAINING">REMAINING (Blue)</option>
                <option value="COMPLETE">COMPLETE (Green)</option>
                <option value="REJECTED">REJECTED (Red)</option>
              </select>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <Label htmlFor="edit_note" className="text-xs font-semibold">
                Note / Description
              </Label>
              <Input
                id="edit_note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
              className="gap-2 font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
