import React from "react";
import { cn } from "@/lib/utils";
import { ExpenseStatus, ExpensePaymentStatus } from "@/types/expense";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface ExpenseStatusBadgeProps {
  status: ExpenseStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function ExpenseStatusBadge({
  status,
  className,
  showIcon = true,
}: ExpenseStatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "PENDING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-2xs transition-colors",
            "bg-[#FEF3C7] text-[#92400E] border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
            className
          )}
          style={{
            // Fallback explicit styles as specified
            backgroundColor: undefined,
          }}
        >
          {showIcon && <Clock className="h-3 w-3 shrink-0" />}
          <span>PENDING</span>
        </span>
      );

    case "REMAINING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-2xs transition-colors",
            "bg-[#DBEAFE] text-[#1E40AF] border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
            className
          )}
        >
          {showIcon && <AlertCircle className="h-3 w-3 shrink-0" />}
          <span>REMAINING</span>
        </span>
      );

    case "COMPLETE":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-2xs transition-colors",
            "bg-[#D1FAE5] text-[#065F46] border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
            className
          )}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 shrink-0" />}
          <span>COMPLETE</span>
        </span>
      );

    case "REJECTED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-2xs transition-colors",
            "bg-[#FEE2E2] text-[#991B1B] border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60",
            className
          )}
        >
          {showIcon && <XCircle className="h-3 w-3 shrink-0" />}
          <span>REJECTED</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-muted text-muted-foreground border-border",
            className
          )}
        >
          {status}
        </span>
      );
  }
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: ExpensePaymentStatus | string;
  className?: string;
}) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "APPROVED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
            className
          )}
        >
          <CheckCircle2 className="h-3 w-3" /> Approved
        </span>
      );
    case "PENDING":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
            className
          )}
        >
          <Clock className="h-3 w-3" /> Pending
        </span>
      );
    case "REJECTED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
            className
          )}
        >
          <XCircle className="h-3 w-3" /> Rejected
        </span>
      );
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground",
            className
          )}
        >
          {status}
        </span>
      );
  }
}
