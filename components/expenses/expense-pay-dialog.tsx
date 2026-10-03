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
import { Expense } from "@/types/expense";
import { payInstallment } from "@/lib/expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ExpenseStatusBadge } from "./expense-status-badge";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";

interface ExpensePayDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSubmitted: () => void;
}

export function ExpensePayDialog({
  expense,
  open,
  onOpenChange,
  onPaymentSubmitted,
}: ExpensePayDialogProps) {
  const { toast } = useToast();

  const remaining = Number(expense?.remaining_amount) || 0;
  const total = Number(expense?.total_amount) || 0;
  const approvedPaid = Number(expense?.paid_amount) || 0;

  const [payAmount, setPayAmount] = useState<string>("");
  const [note, setNote] = useState<string>("second installment");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-fill pay amount with remaining when dialog opens
  useEffect(() => {
    if (open && expense) {
      setPayAmount(String(remaining > 0 ? remaining : ""));
      setNote("second installment");
      setValidationError(null);
    }
  }, [open, expense, remaining]);

  // Real-time validation of entered payment amount against remaining balance
  const numEntered = Number(payAmount);

  useEffect(() => {
    if (!payAmount) {
      setValidationError(null);
      return;
    }

    if (numEntered <= 0) {
      setValidationError("Payment amount must be greater than 0.");
      return;
    }

    if (numEntered > remaining) {
      setValidationError(
        `Payment amount (${numEntered}) exceeds remaining balance. Only ${remaining} is remaining (only ${remaining} baki he)`
      );
      return;
    }

    setValidationError(null);
  }, [payAmount, numEntered, remaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expense) return;

    if (!payAmount || numEntered <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    // Strict client-side validation check
    if (numEntered > remaining) {
      const errorMsg = `Payment amount (${numEntered}) exceeds remaining balance. Only ${remaining} is remaining (only ${remaining} baki he)`;
      setValidationError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      await payInstallment(expense.id, {
        pay_amount: numEntered,
        pay: numEntered,
        note: note.trim() || `Installment payment of ₹${numEntered}`,
      });

      toast.success(
        `Installment request of ${formatCurrency(numEntered)} submitted successfully!`
      );
      onOpenChange(false);
      onPaymentSubmitted();
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(
        err,
        "Failed to submit installment payment."
      );
      setValidationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInvalid = Boolean(validationError) || numEntered <= 0 || !payAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Pay Remaining Amount
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Submit an installment payment request towards your remaining balance.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Prominent Remaining Balance Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-900/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Remaining Balance
                  </span>
                  <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 mt-0.5">
                    {formatCurrency(remaining)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Current Status
                  </span>
                  <div className="mt-1">
                    <ExpenseStatusBadge
                      status={expense?.status || "REMAINING"}
                      showIcon={false}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar & Breakdown */}
              <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/50">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Room Rent: {formatCurrency(total)}</span>
                  <span>Approved Paid: {formatCurrency(approvedPaid)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-blue-200/50 dark:bg-blue-900/40 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        total > 0 ? Math.min(100, (approvedPaid / total) * 100) : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Installment Amount Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="installment_pay_amount" className="text-xs font-semibold">
                  Installment Amount to Pay (₹) <span className="text-destructive">*</span>
                </Label>
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(remaining))}
                    className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Pay Full Remaining ({formatCurrency(remaining)})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground pointer-events-none">
                  ₹
                </span>
                <Input
                  id="installment_pay_amount"
                  type="number"
                  min="1"
                  max={remaining}
                  step="any"
                  required
                  placeholder={`Max ₹${remaining}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className={`pl-7 text-sm font-semibold ${
                    validationError
                      ? "border-destructive focus-visible:ring-destructive bg-destructive/5"
                      : ""
                  }`}
                />
              </div>

              {/* Strict validation message required by Scenario 2 / Step C */}
              {validationError && (
                <div className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive font-medium animate-in fade-in-50 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {!validationError && numEntered > 0 && numEntered <= remaining && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  {remaining - numEntered === 0 ? (
                    <span>This payment will fully clear the remaining balance!</span>
                  ) : (
                    <span>
                      Remaining balance after payment:{" "}
                      <strong>{formatCurrency(remaining - numEntered)}</strong>
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Note / Purpose */}
            <div className="space-y-1.5">
              <Label htmlFor="installment_note" className="text-xs font-semibold">
                Payment Remark / Note
              </Label>
              <Input
                id="installment_note"
                type="text"
                placeholder="e.g. second installment, room rent remaining"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Existing Payments Summary if any */}
            {expense?.payments && expense.payments.length > 0 && (
              <div className="rounded-lg border border-border p-3 space-y-1.5 bg-muted/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <History className="h-3.5 w-3.5" />
                  <span>Previous Payment Requests ({expense.payments.length})</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {expense.payments.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="flex items-center justify-between text-[11px] py-0.5 border-b border-border/40 last:border-0"
                    >
                      <span className="text-muted-foreground truncate max-w-[200px]">
                        {p.note || `Installment #${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(p.amount)}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            p.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : p.status === "PENDING"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              disabled={isSubmitting || isInvalid}
              className="gap-2 font-semibold shadow-xs bg-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Payment...
                </>
              ) : (
                `Submit Payment (${formatCurrency(numEntered || 0)})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
