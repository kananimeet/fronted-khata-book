import { User } from "./auth";

export type StatementTransactionType = "CREDIT" | "DEBIT";

export interface StatementEntry {
  id: string;
  date: string;
  time: string;
  type: StatementTransactionType;
  amount: number;
  balance: number;
  category: string;
  note: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
  payment_photo?: string;
  referenceId: string;
  referenceType: "ROOM_RENT_PAYMENT" | "DAILY_ROOM_EXPENSE";
}

export interface StatementSummary {
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
  netChange: number;
  totalTransactions: number;
  currentPoolBalance: number;
}

export interface StatementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StatementResponse {
  summary: StatementSummary;
  pagination: StatementPagination;
  items: StatementEntry[];
}

export interface StatementQueryParams {
  page?: number;
  limit?: number;
  all?: boolean;
  type?: "ALL" | "CREDIT" | "DEBIT";
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  user_id?: string;
  category?: string;
  search?: string;
  sortOrder?: "ASC" | "DESC";
}

