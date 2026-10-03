import api from "./api";
import {
  Expense,
  ExpenseListResponse,
  SingleExpenseResponse,
  UserTotalsResponse,
  CreateExpensePayload,
  PayInstallmentPayload,
  ApproveExpensePayload,
  RejectExpensePayload,
  EditExpensePayload,
} from "@/types/expense";

export interface ExpenseQueryParams {
  search?: string;
  status?: string;
  user_id?: string;
  page?: number;
  limit?: number;
}

/**
 * Create a new room rate expense request.
 */
export async function createExpense(
  payload: CreateExpensePayload
): Promise<Expense> {
  const response = await api.post("/expenses", payload);
  return response.data?.data ?? response.data;
}

/**
 * Submit subsequent installment payment for remaining balance.
 */
export async function payInstallment(
  expenseId: string,
  payload: PayInstallmentPayload
): Promise<Expense> {
  const response = await api.post(`/expenses/${expenseId}/pay`, payload);
  return response.data?.data ?? response.data;
}

/**
 * List expenses (User gets own; Admin gets all with optional filters).
 */
export async function getExpenses(
  params?: ExpenseQueryParams
): Promise<any> {
  const response = await api.get("/expenses", { params });
  return response.data?.data ?? response.data;
}

/**
 * Get single expense with installment history.
 */
export async function getExpenseById(id: string): Promise<Expense> {
  const response = await api.get(`/expenses/${id}`);
  return response.data?.data ?? response.data;
}

/**
 * Admin: Get All users with approved totals & request status (Total List API).
 */
export async function getUserExpenseTotals(): Promise<any> {
  const response = await api.get("/expenses/totals/users");
  return response.data?.data ?? response.data;
}

/**
 * Admin: Approve pending request.
 */
export async function approveExpense(
  id: string,
  payload?: ApproveExpensePayload
): Promise<Expense> {
  const response = await api.patch(`/expenses/${id}/approve`, payload || {});
  return response.data?.data ?? response.data;
}

/**
 * Admin: Reject pending request.
 */
export async function rejectExpense(
  id: string,
  payload?: RejectExpensePayload
): Promise<Expense> {
  const response = await api.patch(`/expenses/${id}/reject`, payload || {});
  return response.data?.data ?? response.data;
}

/**
 * Admin: Edit expense details (Amounts, notes, status).
 */
export async function updateExpense(
  id: string,
  payload: EditExpensePayload
): Promise<Expense> {
  const response = await api.patch(`/expenses/${id}`, payload);
  return response.data?.data ?? response.data;
}

/**
 * Admin: Delete expense.
 */
export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}
