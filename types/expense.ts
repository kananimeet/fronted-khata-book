import { User } from "./auth";

export type ExpenseStatus = "PENDING" | "REMAINING" | "COMPLETE" | "REJECTED";
export type ExpensePaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ExpensePayment {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  note?: string;
  status: ExpensePaymentStatus;
  admin_note?: string;
  created_at: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  user?: User;
  note: string;
  total_amount: number;
  pay_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: ExpenseStatus;
  admin_note?: string;
  payments?: ExpensePayment[];
  created_at: string;
  updated_at: string;
}

export interface ExpenseSummaryStats {
  totalRoomRate?: number;
  totalApproved?: number;
  totalPending?: number;
  totalRemaining?: number;
  totalRoomRateAmount?: number;
  totalApprovedAmount?: number;
  totalPendingAmount?: number;
  totalRemainingAmount?: number;
  totalRecords?: number;
}

export interface ExpenseListPagination {
  items?: Expense[];
  expenses?: Expense[];
  data?: Expense[];
  rows?: Expense[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  summary?: ExpenseSummaryStats;
}

export interface ExpenseListResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: ExpenseListPagination | Expense[];
}

export interface SingleExpenseResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: Expense;
}

export interface UserExpenseTotalsItem {
  user: {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    profile_picture?: string | null;
  };
  total: number; // Approved total (0 when pending, 5000 when approved)
  total_amount: number; // Total room rent
  total_approved: number;
  total_pending: number;
  total_remaining: number;
  status: ExpenseStatus;
  counts: {
    total: number;
    pending: number;
    remaining: number;
    complete: number;
  };
  requests: Expense[];
}

export interface GrandSummary {
  grandTotalRoomRate: number;
  grandTotalApproved: number;
  grandTotalPending: number;
  grandTotalRemaining: number;
  totalUsers: number;
}

export interface UserTotalsResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: {
    users: UserExpenseTotalsItem[];
    grandSummary: GrandSummary;
  };
}

export interface CreateExpensePayload {
  total?: number;
  total_amount?: number;
  pay?: number;
  pay_amount?: number;
  note?: string;
  expense_id?: string;
}

export interface PayInstallmentPayload {
  pay?: number;
  pay_amount: number;
  note?: string;
}

export interface ApproveExpensePayload {
  admin_note?: string;
  remarks?: string;
}

export interface RejectExpensePayload {
  remarks?: string;
  reason?: string;
}

export interface EditExpensePayload {
  total_amount?: number;
  pay_amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
  status?: ExpenseStatus;
  note?: string;
}
