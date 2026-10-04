"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DailyExpense } from "@/types/daily-expense";
import { deleteDailyExpense } from "@/lib/daily-expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DailyExpenseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: DailyExpense | null;
  onSuccess: (deletedId: string | number) => void;
}

export function DailyExpenseDeleteDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: DailyExpenseDeleteDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDailyExpense(expense.id);
      toast.success("Daily expense deleted successfully.");
      onSuccess(expense.id);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(err, "Failed to delete expense. Please try again.")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-destructive/10 text-destructive shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Delete Expense Record?
              </DialogTitle>
              <DialogDescription className="text-xs">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs space-y-3">
          <p className="text-muted-foreground">
            Are you sure you want to permanently delete this expense of{" "}
            <span className="font-bold text-foreground">
              {formatCurrency(expense.amount)}
            </span>{" "}
            ({expense.category})?
          </p>

          <div className="p-3 rounded-lg border border-border/70 bg-muted/30 text-xs">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Type:</span>{" "}
              {expense.expense_type === "room" ? "Room Expense" : "Personal (Own)"}
            </p>
            {expense.note && (
              <p className="text-muted-foreground mt-1 truncate">
                <span className="font-semibold text-foreground">Note:</span>{" "}
                {expense.note}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs h-8"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs font-semibold h-8 min-w-[90px]"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Deleting...
              </span>
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
