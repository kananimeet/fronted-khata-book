import api from "./api";
import { fetchWithDedupe, clearMutationCaches } from "./api-cache";
import { User } from "@/types/auth";
export * from "./setting-api";
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
  clearMutationCaches();
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
  clearMutationCaches();
  return response.data?.data ?? response.data;
}

/**
 * List expenses (User gets own; Admin gets all with optional filters).
 * Accelerated with in-flight deduplication and memory caching.
 */
export async function getExpenses(
  params?: ExpenseQueryParams,
  forceRefresh = false
): Promise<any> {
  const cacheKey = `expenses-list-${JSON.stringify(params || {})}`;

  return fetchWithDedupe(
    cacheKey,
    async () => {
      const response = await api.get("/expenses", { params });
      return response.data?.data ?? response.data;
    },
    15000,
    forceRefresh
  );
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
 * Accelerated with in-flight deduplication and memory caching.
 */
export async function getUserExpenseTotals(forceRefresh = false): Promise<any> {
  return fetchWithDedupe(
    "expenses-totals-users",
    async () => {
      const response = await api.get("/expenses/totals/users");
      return response.data?.data ?? response.data;
    },
    30000,
    forceRefresh
  );
}

/**
 * Admin: Approve pending request.
 */
export async function approveExpense(
  id: string,
  payload?: ApproveExpensePayload
): Promise<Expense> {
  const response = await api.patch(`/expenses/${id}/approve`, payload || {});
  clearMutationCaches();
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
  clearMutationCaches();
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
  clearMutationCaches();
  return response.data?.data ?? response.data;
}

/**
 * Admin: Delete expense.
 */
export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
  clearMutationCaches();
}

/**
 * Admin: Fetch users list for expense user selection dropdown.
 * Primary endpoint: GET /api/v1/users?limit=100
 * Fallback endpoint: GET /api/v1/expenses/totals/users
 * Accelerated with 2-minute memory caching.
 */
export async function getUsersForExpenseSelect(forceRefresh = false): Promise<User[]> {
  return fetchWithDedupe(
    "users-select-options",
    async () => {
      try {
        const response = await api.get("/users", { params: { limit: 100 } });
        const rawData =
          response.data?.data?.users ||
          response.data?.users ||
          response.data?.data ||
          response.data;

        if (Array.isArray(rawData) && rawData.length > 0) {
          return rawData;
        }
      } catch (err) {
        console.warn("Could not load /users?limit=100, attempting fallback:", err);
      }

      // Fallback: GET /api/v1/expenses/totals/users
      try {
        const totalsRes = await api.get("/expenses/totals/users");
        const totalsData =
          totalsRes.data?.data?.users ||
          totalsRes.data?.users ||
          totalsRes.data?.data ||
          totalsRes.data;

        if (Array.isArray(totalsData)) {
          return totalsData
            .map((item: any) => item.user || item)
            .filter(Boolean);
        }
      } catch (err) {
        console.warn("Could not load /expenses/totals/users fallback:", err);
      }

      return [];
    },
    120000,
    forceRefresh
  );
}
