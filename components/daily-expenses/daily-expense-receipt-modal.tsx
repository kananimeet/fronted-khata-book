"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getDailyExpensePhotoUrl } from "@/lib/daily-expense-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DailyExpense } from "@/types/daily-expense";
import { ExternalLink, Download, FileText, X } from "lucide-react";

interface DailyExpenseReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: DailyExpense | null;
}

export function DailyExpenseReceiptModal({
  open,
  onOpenChange,
  expense,
}: DailyExpenseReceiptModalProps) {
  if (!expense || !expense.payment_photo) return null;

  const photoUrl = getDailyExpensePhotoUrl(expense.payment_photo);
  if (!photoUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-background border border-border/80 shadow-2xl">
        <DialogHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between gap-3 bg-muted/20 shrink-0">
          <div>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Receipt / Bill Verification
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(expense.amount)} • {expense.category} •{" "}
              {formatDate(expense.expense_date)}
            </p>
          </div>

          <div className="flex items-center gap-2 mr-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="h-8 text-xs gap-1.5"
            >
              <a
                href={photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open image in new window"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Full</span>
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* High Res Image Display */}
        <div className="p-4 flex items-center justify-center bg-black/5 dark:bg-black/30 min-h-[300px] max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={`Receipt for ${expense.category}`}
            className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-md border border-border/60"
          />
        </div>

        {/* Footer info note */}
        {expense.note && (
          <div className="p-3 border-t border-border/60 bg-muted/10 text-xs">
            <span className="font-semibold text-muted-foreground">Notes: </span>
            <span className="text-foreground">{expense.note}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
