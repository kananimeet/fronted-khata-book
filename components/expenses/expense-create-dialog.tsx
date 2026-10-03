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
import { createExpense } from "@/lib/expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ExpenseStatusBadge } from "./expense-status-badge";
import { IndianRupee, Loader2, Info, AlertCircle } from "lucide-react";

interface ExpenseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseCreated: () => void;
}

export function ExpenseCreateDialog({
  open,
  onOpenChange,
  onExpenseCreated,
}: ExpenseCreateDialogProps) {
  const { toast } = useToast();

  const [totalAmount, setTotalAmount] = useState<string>("6000");
  const [payAmount, setPayAmount] = useState<string>("5000");
  const [note, setNote] = useState<string>("room pay");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const numTotal = Number(totalAmount) || 0;
  const numPay = Number(payAmount) || 0;
  const isOverPay = numPay > numTotal;
  const calculatedRemaining = Math.max(0, numTotal - numPay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numTotal || numTotal <= 0) {
      toast.error("Please enter a valid total room rent amount.");
      return;
    }

    if (numPay < 0) {
      toast.error("Payment amount cannot be negative.");
      return;
    }

    if (isOverPay) {
      toast.error("Requested pay amount cannot be greater than the total room rent.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpense({
        total: numTotal,
        total_amount: numTotal,
        pay: numPay,
        pay_amount: numPay,
        note: note.trim() || "room pay",
      });

      toast.success("Room rent expense request submitted successfully!");
      onOpenChange(false);
      onExpenseCreated();

      // Reset form
      setTotalAmount("6000");
      setPayAmount("5000");
      setNote("room pay");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to submit expense request."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  New Room Rent Request
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Submit a room rate expense payment request for admin review.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Total Amount Field */}
            <div className="space-y-1.5">
              <Label htmlFor="total_amount" className="text-xs font-semibold">
                Total Room Rent / Expense (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground pointer-events-none">
                  ₹
                </span>
                <Input
                  id="total_amount"
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 6000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="pl-7 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Pay Amount Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pay_amount" className="text-xs font-semibold">
                  Initial Payment Amount (₹) <span className="text-destructive">*</span>
                </Label>
                {numTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(numTotal))}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Pay Full (₹{numTotal})
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground pointer-events-none">
                  ₹
                </span>
                <Input
                  id="pay_amount"
                  type="number"
                  min="0"
                  max={numTotal || undefined}
                  step="any"
                  required
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={`pl-7 text-sm font-semibold ${
                    isOverPay ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
              </div>

              {isOverPay && (
                <p className="flex items-center gap-1 text-xs text-destructive mt-1 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Pay amount cannot exceed total room rent ({formatCurrency(numTotal)}).
                </p>
              )}
            </div>

            {/* Purpose / Note */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs font-semibold">
                Purpose / Note
              </Label>
              <Input
                id="note"
                type="text"
                placeholder="e.g. room pay, monthly rent"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Live Financial Breakdown Summary Card */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Financial Projection Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/60">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">
                    Room Rate
                  </div>
                  <div className="font-bold text-foreground text-sm">
                    {formatCurrency(numTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">
                    Initial Pay
                  </div>
                  <div className="font-bold text-primary text-sm">
                    {formatCurrency(numPay)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">
                    Remaining
                  </div>
                  <div
                    className={`font-bold text-sm ${
                      calculatedRemaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(calculatedRemaining)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]">
                <span className="text-muted-foreground">Initial Submission Status:</span>
                <ExpenseStatusBadge status="PENDING" showIcon={false} />
              </div>
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
              disabled={isSubmitting || isOverPay || numTotal <= 0}
              className="gap-2 font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
