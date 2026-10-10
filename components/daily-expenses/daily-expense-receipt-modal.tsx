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
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border border-white/60 dark:border-white/10 glass-card rounded-3xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-border/50 flex flex-row items-center justify-between gap-3 bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-fuchsia-600/15 shrink-0">
          <div>
            <DialogTitle className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-xs">
                <FileText className="h-4 w-4" />
              </div>
              Receipt / Bill Verification
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              <span className="font-mono font-bold text-foreground">{formatCurrency(expense.amount)}</span> • {expense.category} •{" "}
              {formatDate(expense.expense_date)}
            </p>
          </div>

          <div className="flex items-center gap-2 mr-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="h-8 text-xs gap-1.5 rounded-xl glass-pill font-semibold"
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
