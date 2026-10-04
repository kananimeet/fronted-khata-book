"use client";

import React from "react";
import {
  DailyExpense,
  DailyExpenseType,
  DailyExpenseStatus,
} from "@/types/daily-expense";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/api";
import { getDailyExpensePhotoUrl } from "@/lib/daily-expense-api";
import { CategoryBadge } from "./category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyExpenseTableProps {
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

export function DailyExpenseTable({
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
}: DailyExpenseTableProps) {
  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-border/40 last:border-none">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card/60 p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
          <Receipt className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          No daily expenses found
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          No records match your selected filters. Adjust your search or record a
          new daily expense request above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-foreground">
          <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/70 uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="py-3 px-4">
                Date & Category
              </th>
              <th scope="col" className="py-3 px-4">
                User
              </th>
              <th scope="col" className="py-3 px-4">
                Type
              </th>
              <th scope="col" className="py-3 px-4">
                Amount
              </th>
              <th scope="col" className="py-3 px-4">
                Note & Bill
              </th>
              <th scope="col" className="py-3 px-4">
                Status
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {expenses.map((expense) => {
              const isRoom = expense.expense_type === "room";
              const isPending = expense.status === "PENDING";
              const isApproved = expense.status === "APPROVED";
              const isRejected = expense.status === "REJECTED";

              const hasPhoto = Boolean(expense.payment_photo);
              const isSelf =
                currentUserId !== undefined &&
                String(expense.user_id) === String(currentUserId);

              // Regular user can edit/delete ONLY if PENDING
              const canUserModify = isSelf && isPending;
              // Admin can edit/delete or approve/reject
              const canAdminApprove = isAdmin && isPending;

              const memberName = expense.user?.name || "Roommate";
              const profilePic = getProfilePictureUrl(expense.user?.profile_picture);

              return (
                <tr
                  key={expense.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* 1. Date & Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {formatDate(expense.expense_date)}
                      </p>
                      <CategoryBadge category={expense.category} size="sm" />
                    </div>
                  </td>

                  {/* 2. Roommate / User (Visible to everyone) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border border-border shrink-0">
                        {profilePic && (
                          <AvatarImage src={profilePic} alt={memberName} />
                        )}
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {getInitials(memberName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-foreground truncate max-w-[120px]">
                            {memberName}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                              (You)
                            </span>
                          )}
                        </div>
                        {expense.user?.email && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {expense.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 3. Type Pill */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
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
                  </td>

                  {/* 4. Amount */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-sm text-foreground">
                        {formatCurrency(expense.amount)}
                      </p>
                      {isRoom && isApproved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <TrendingDown className="h-2.5 w-2.5" />
                          Rent Reduced
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Note & Bill Thumbnail */}
                  <td className="py-3 px-4 max-w-[200px]">
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground truncate">
                        {expense.note || <span className="italic text-muted-foreground/60">No notes provided</span>}
                      </p>

                      {hasPhoto && (
                        <button
                          type="button"
                          onClick={() => onPreviewReceipt(expense)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/15 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <FileImage className="h-3 w-3" />
                          <span>View Receipt</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 6. Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="space-y-1">
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

                      {/* Admin Note remark on hover/display if rejected or approved */}
                      {expense.admin_note && (
                        <p
                          className="text-[10px] text-muted-foreground italic truncate max-w-[150px]"
                          title={`Admin note: ${expense.admin_note}`}
                        >
                          Note: {expense.admin_note}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* 7. Action Buttons */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details Button (Always visible for every record) */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewExpense(expense)}
                        className="h-8 px-2 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1"
                        title="View expense details"
                        aria-label="View expense details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Button>

                      {/* Admin Approve & Reject Buttons */}
                      {canAdminApprove && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onApproveExpense(expense)}
                            className="h-8 px-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            title="Approve expense"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" />
                            Approve
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onRejectExpense(expense)}
                            className="h-8 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                            title="Reject expense"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {/* User Edit Button (PENDING ONLY) or Admin Edit */}
                      {(canUserModify || (isAdmin && isPending)) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditExpense(expense)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Edit expense"
                          aria-label="Edit expense"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* User Delete Button (PENDING ONLY) or Admin Delete */}
                      {(canUserModify || isAdmin) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteExpense(expense)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete expense"
                          aria-label="Delete expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
