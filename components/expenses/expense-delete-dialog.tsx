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
import { useToast } from "@/components/ui/toast";
import { Expense } from "@/types/expense";
import { deleteExpense } from "@/lib/expense-api";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface ExpenseDeleteDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function ExpenseDeleteDialog({
  expense,
  open,
  onOpenChange,
  onDeleted,
}: ExpenseDeleteDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast.success("Expense request deleted successfully.");
      onOpenChange(false);
      onDeleted();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to delete expense."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Delete Expense Record
              </DialogTitle>
              <DialogDescription className="text-xs">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 text-xs space-y-2">
          <p className="text-muted-foreground">
            Are you sure you want to delete this expense of{" "}
            <strong className="text-foreground font-semibold">
              {formatCurrency(expense.total_amount)}
            </strong>{" "}
            for user <strong className="text-foreground">{expense.user?.name || "Member"}</strong>?
          </p>
          <div className="p-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
            All associated payment records and installments will also be removed.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 font-semibold shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Expense
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
