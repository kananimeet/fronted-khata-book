"use client";

import React from "react";
import {
  DailyExpense,
  DailyExpenseType,
  DailyExpenseStatus,
} from "@/types/daily-expense";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/api";
import { CategoryBadge } from "./category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  User as UserIcon,
  Receipt,
  FileImage,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  Info,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyExpenseCardListProps {
  expenses: DailyExpense[];
  isLoading: boolean;
  isAdmin: boolean;
  currentUserId?: string | number;
  onViewExpense: (expense: DailyExpense) => void;
  onEditExpense: (expense: DailyExpense) => void;
  onDeleteExpense: (expense: DailyExpense) => void;
  onApproveExpense: (expense: DailyExpense) => void;
  onRejectExpense: (expense: DailyExpense) => void;
  onPreviewReceipt: (expense: DailyExpense) => void;
}

export function DailyExpenseCardList({
  expenses,
  isLoading,
  isAdmin,
  currentUserId,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
  onApproveExpense,
  onRejectExpense,
  onPreviewReceipt,
}: DailyExpenseCardListProps) {
  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 space-y-3 border-border/70">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return null; // Empty state handled by table/wrapper
  }

  return (
    <div className="space-y-3.5">
      {expenses.map((expense) => {
        const isRoom = expense.expense_type === "room";
        const isPending = expense.status === "PENDING";
        const isApproved = expense.status === "APPROVED";
        const isRejected = expense.status === "REJECTED";

        const hasPhoto = Boolean(expense.payment_photo);
        const isSelf =
          currentUserId !== undefined &&
          String(expense.user_id) === String(currentUserId);

        const canUserModify = isSelf && isPending;
        const canAdminApprove = isAdmin && isPending;

        const memberName = expense.user?.name || "Roommate";
        const profilePic = getProfilePictureUrl(expense.user?.profile_picture);

        return (
          <Card
            key={expense.id}
            className="border-border/70 bg-card/90 shadow-sm overflow-hidden transition-all duration-200"
          >
            {/* Top Accent Strip */}
            <div
              className={cn(
                "h-1 w-full",
                isRoom ? "bg-indigo-500" : "bg-purple-500"
              )}
            />

            <CardContent className="p-4 space-y-3">
              {/* Top row: Type & Category + Date */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
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
                    <span>{isRoom ? "Room" : "Own"}</span>
                  </span>

                  <CategoryBadge category={expense.category} size="sm" />
                </div>

                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatDate(expense.expense_date)}
                </span>
              </div>

              {/* Second row: Amount & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xl font-bold font-mono tracking-tight text-foreground">
                    {formatCurrency(expense.amount)}
                  </h4>
                  {isRoom && isApproved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 mt-0.5">
                      <TrendingDown className="h-2.5 w-2.5" />
                      Rent Reduced
                    </span>
                  )}
                </div>

                <div className="shrink-0">
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      <Clock className="h-3 w-3" />
                      Under Review
                    </span>
                  )}
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                      <XCircle className="h-3 w-3" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Admin note if present */}
              {expense.admin_note && (
                <div className="p-2 rounded-lg bg-muted/40 border border-border/60 text-xs">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin Remark:
                  </p>
                  <p className="text-foreground italic mt-0.5">
                    &ldquo;{expense.admin_note}&rdquo;
                  </p>
                </div>
              )}

              {/* Member Info (Visible to everyone) */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 border border-border shrink-0">
                    {profilePic && (
                      <AvatarImage src={profilePic} alt={memberName} />
                    )}
                    <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                      {getInitials(memberName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground truncate">
                    {memberName}
                  </span>
                </div>
                {isSelf && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded shrink-0">
                    (You)
                  </span>
                )}
              </div>

              {/* Note / Description & Receipt Button */}
              <div className="space-y-2 pt-1">
                {expense.note && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {expense.note}
                  </p>
                )}

                {hasPhoto && (
                  <button
                    type="button"
                    onClick={() => onPreviewReceipt(expense)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    <span>View Receipt Attachment</span>
                  </button>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewExpense(expense)}
                    className="h-7 text-xs font-semibold text-primary hover:bg-primary/10 px-2"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View Details
                  </Button>

                  {canAdminApprove && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onApproveExpense(expense)}
                        className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs px-2.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onRejectExpense(expense)}
                        className="h-7 text-xs font-semibold px-2.5"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  {(canUserModify || (isAdmin && isPending)) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditExpense(expense)}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}

                  {(canUserModify || isAdmin) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteExpense(expense)}
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
