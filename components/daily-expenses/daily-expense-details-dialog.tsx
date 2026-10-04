"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/api";
import { getDailyExpensePhotoUrl } from "@/lib/daily-expense-api";
import { DailyExpense } from "@/types/daily-expense";
import { CategoryBadge } from "./category-badge";
import {
  Home,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileImage,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  Edit,
  Trash2,
  Receipt,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyExpenseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: DailyExpense | null;
  isAdmin?: boolean;
  currentUserId?: string | number;
  onEditExpense?: (expense: DailyExpense) => void;
  onDeleteExpense?: (expense: DailyExpense) => void;
  onApproveExpense?: (expense: DailyExpense) => void;
  onRejectExpense?: (expense: DailyExpense) => void;
  onPreviewReceipt?: (expense: DailyExpense) => void;
}

export function DailyExpenseDetailsDialog({
  open,
  onOpenChange,
  expense,
  isAdmin = false,
  currentUserId,
  onEditExpense,
  onDeleteExpense,
  onApproveExpense,
  onRejectExpense,
  onPreviewReceipt,
}: DailyExpenseDetailsDialogProps) {
  if (!expense) return null;

  const isRoom = expense.expense_type === "room";
  const isPending = expense.status === "PENDING";
  const isApproved = expense.status === "APPROVED";
  const isRejected = expense.status === "REJECTED";

  const memberName = expense.user?.name || "Roommate";
  const memberEmail = expense.user?.email || "";
  const profilePic = getProfilePictureUrl(expense.user?.profile_picture);
  const receiptPhotoUrl = getDailyExpensePhotoUrl(expense.payment_photo);

  const isSelf =
    currentUserId !== undefined &&
    String(expense.user_id) === String(currentUserId);

  const canUserModify = isSelf && isPending;
  const canAdminApprove = isAdmin && isPending;

  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Daily Expense Details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Expense ID: #{String(expense.id).slice(-6)} • Recorded on{" "}
                  {formatDate(expense.created_at || expense.expense_date)}
                </DialogDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              {isPending && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  Under Review
                </span>
              )}
              {isApproved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approved
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  <XCircle className="h-3.5 w-3.5" />
                  Rejected
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* 1. Member Information Card */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 border border-border shrink-0">
                {profilePic && (
                  <AvatarImage src={profilePic} alt={memberName} />
                )}
                <AvatarFallback className="font-bold bg-primary/10 text-primary text-xs">
                  {getInitials(memberName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground truncate">
                    {memberName}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded shrink-0">
                      (You)
                    </span>
                  )}
                </div>
                {memberEmail && (
                  <p className="text-muted-foreground truncate">{memberEmail}</p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Paid By
              </span>
              <span className="font-semibold text-foreground">Room Member</span>
            </div>
          </div>

          {/* 2. Amount & Category Details Card */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                  Expense Amount
                </span>
                <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {formatCurrency(expense.amount)}
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider block">
                  Category
                </span>
                <CategoryBadge category={expense.category} size="md" />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Type:</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                    isRoom
                      ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                      : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  )}
                >
                  {isRoom ? (
                    <Home className="h-3 w-3" />
                  ) : (
                    <UserIcon className="h-3 w-3" />
                  )}
                  <span>{isRoom ? "Room Expense" : "Personal (Own)"}</span>
                </span>

                {isRoom && isApproved && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <TrendingDown className="h-2.5 w-2.5" />
                    Rent Reduced
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>Date: {formatDate(expense.expense_date)}</span>
              </div>
            </div>
          </div>

          {/* 3. Room Rent Impact Notice */}
          {isRoom && (
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Monthly Room Rent Settlement</p>
                <p className="text-[11px] text-muted-foreground dark:text-indigo-300/80 mt-0.5">
                  {isApproved
                    ? `₹${expense.amount} has been approved and credited towards ${memberName}'s room rent liability.`
                    : `This ₹${expense.amount} expense will reduce ${memberName}'s monthly room rent liability upon admin approval.`}
                </p>
              </div>
            </div>
          )}

          {/* 4. Notes / Expense Description */}
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              Expense Item / Description
            </span>
            <div className="p-3 rounded-xl border border-border/80 bg-card text-xs text-foreground">
              {expense.note ? (
                <p className="whitespace-pre-wrap">{expense.note}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  No description provided for this expense.
                </p>
              )}
            </div>
          </div>

          {/* 5. Admin Remarks / Note */}
          {expense.admin_note && (
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                Admin Remark
              </span>
              <div className="p-3 rounded-xl border border-border/80 bg-muted/40 text-xs text-foreground italic">
                &ldquo;{expense.admin_note}&rdquo;
              </div>
            </div>
          )}

          {/* 6. Receipt / Payment Photo */}
          <div className="space-y-1.5">
            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              Receipt / Bill Photo
            </span>

            {receiptPhotoUrl ? (
              <div className="rounded-xl border border-border/80 overflow-hidden bg-black/5 dark:bg-black/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-xs text-foreground flex items-center gap-1.5">
                    <FileImage className="h-3.5 w-3.5 text-primary" />
                    Attached Bill Receipt
                  </span>
                  {onPreviewReceipt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreviewReceipt(expense)}
                      className="h-7 text-xs text-primary gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View High-Res Lightbox
                    </Button>
                  )}
                </div>

                <div
                  onClick={() => onPreviewReceipt?.(expense)}
                  className="rounded-lg overflow-hidden border border-border/60 max-h-56 flex items-center justify-center cursor-pointer group bg-background"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptPhotoUrl}
                    alt="Receipt preview"
                    className="max-h-56 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-border/80 text-muted-foreground text-center bg-card">
                No receipt photo attached with this expense record.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Admin Direct Approve / Reject inside Details */}
            {canAdminApprove && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onApproveExpense?.(expense);
                  }}
                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onOpenChange(false);
                    onRejectExpense?.(expense);
                  }}
                  className="h-8 text-xs font-semibold"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {/* User Edit & Delete buttons if PENDING */}
            {canUserModify && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEditExpense?.(expense);
                  }}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onDeleteExpense?.(expense);
                  }}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
