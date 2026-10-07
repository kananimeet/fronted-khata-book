import { api, getProfilePictureUrl } from "./api";
import { fetchWithDedupe, clearMutationCaches } from "./api-cache";
import {
  DailyExpense,
  DailyExpenseFilterParams,
  DailyExpenseListResponse,
  CreateDailyExpensePayload,
  UpdateDailyExpensePayload,
  DailyExpensesChartResponse,
  DailyTrendItem,
  MonthlyTrendItem,
  CategoryBreakdownItem,
} from "@/types/daily-expense";

/**
 * Resolves receipt/attachment photo URL.
 */
export function getDailyExpensePhotoUrl(path?: string | null): string | undefined {
  return getProfilePictureUrl(path);
}

/**
 * Fetch daily expenses list with filters, pagination, and summary statistics.
 * Accelerated with in-flight deduplication and memory caching.
 */
export async function getDailyExpenses(
  filters: DailyExpenseFilterParams = {}
): Promise<DailyExpenseListResponse> {
  const params: Record<string, string | number> = {};

  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search && filters.search.trim()) params.search = filters.search.trim();
  if (filters.expense_type && filters.expense_type !== "all") {
    params.expense_type = filters.expense_type;
  }
  if (filters.status && filters.status !== "all") {
    params.status = filters.status;
  }
  if (filters.category && filters.category !== "all") {
    params.category = filters.category;
  }
  if (filters.user_id && filters.user_id !== "all") {
    params.user_id = filters.user_id;
  }
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const cacheKey = `daily-expenses-${JSON.stringify(params)}`;

  return fetchWithDedupe(
    cacheKey,
    async () => {
      const response = await api.get("/daily-expenses", { params });
      const raw = response.data?.data || response.data || {};

      // Safely extract items
      const items: DailyExpense[] = Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw)
        ? raw
        : [];

      // Safely extract pagination
      const pagination = raw.pagination || raw.meta || {
        total: items.length,
        page: filters.page || 1,
        totalPages: Math.max(1, Math.ceil(items.length / (filters.limit || 10))),
      };

      // Safely extract summary
      const summary = raw.summary || {
        totalAmount: items
          .filter((i) => i.status === "APPROVED")
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        totalRoomAmount: items
          .filter((i) => i.expense_type === "room" && i.status === "APPROVED")
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        approvedRoomAmount: items
          .filter((i) => i.expense_type === "room" && i.status === "APPROVED")
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        totalOwnAmount: items
          .filter((i) => i.expense_type === "own" && i.status === "APPROVED")
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        pendingCount: items.filter((i) => i.status === "PENDING").length,
        approvedCount: items.filter((i) => i.status === "APPROVED").length,
        rejectedCount: items.filter((i) => i.status === "REJECTED").length,
      };

      return {
        items,
        pagination,
        summary,
        success: true,
      };
    },
    15000,
    !!filters.forceRefresh
  );
}

/**
 * Create a new daily expense. Supports receipt image upload via FormData.
 */
export async function createDailyExpense(
  payload: CreateDailyExpensePayload
): Promise<DailyExpense> {
  const formData = new FormData();
  formData.append("amount", String(payload.amount));
  formData.append("category", payload.category);
  formData.append("expense_type", payload.expense_type);
  formData.append("expense_date", payload.expense_date);

  if (payload.note && payload.note.trim()) {
    formData.append("note", payload.note.trim());
  }

  if (payload.payment_photo) {
    formData.append("payment_photo", payload.payment_photo);
  }

  const response = await api.post("/daily-expenses", formData);
  clearMutationCaches();
  return response.data?.data || response.data;
}

/**
 * Edit an existing daily expense (User can only edit if status is PENDING).
 */
export async function updateDailyExpense(
  id: string | number,
  payload: UpdateDailyExpensePayload
): Promise<DailyExpense> {
  const formData = new FormData();

  if (payload.amount !== undefined) {
    formData.append("amount", String(payload.amount));
  }
  if (payload.category) {
    formData.append("category", payload.category);
  }
  if (payload.expense_type) {
    formData.append("expense_type", payload.expense_type);
  }
  if (payload.expense_date) {
    formData.append("expense_date", payload.expense_date);
  }
  if (payload.note !== undefined) {
    formData.append("note", payload.note.trim());
  }
  if (payload.payment_photo) {
    formData.append("payment_photo", payload.payment_photo);
  }

  const response = await api.patch(`/daily-expenses/${id}`, formData);
  clearMutationCaches();
  return response.data?.data || response.data;
}

/**
 * Admin: Approve a pending daily expense.
 */
export async function approveDailyExpense(
  id: string | number,
  admin_note?: string
): Promise<DailyExpense> {
  const response = await api.patch(`/daily-expenses/${id}/approve`, {
    admin_note: admin_note?.trim() || undefined,
  });
  clearMutationCaches();
  return response.data?.data || response.data;
}

/**
 * Admin: Reject a pending daily expense.
 */
export async function rejectDailyExpense(
  id: string | number,
  admin_note?: string
): Promise<DailyExpense> {
  const response = await api.patch(`/daily-expenses/${id}/reject`, {
    admin_note: admin_note?.trim() || undefined,
  });
  clearMutationCaches();
  return response.data?.data || response.data;
}

/**
 * Delete a daily expense (User can delete only if PENDING; Admin can delete).
 */
export async function deleteDailyExpense(id: string | number): Promise<void> {
  await api.delete(`/daily-expenses/${id}`);
  clearMutationCaches();
}

const DAY_OF_WEEK_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Fetch daily expenses analytics chart data from backend endpoint:
 * GET /daily-expenses/chart?year={year}&month={month}
 * With resilient client-side calculation fallback and deduplication caching.
 */
export async function getDailyExpensesChart(
  year: number,
  month: number, // 1 to 12
  forceRefresh = false
): Promise<DailyExpensesChartResponse> {
  const cacheKey = `daily-expenses-chart-${year}-${month}`;

  return fetchWithDedupe(
    cacheKey,
    async () => {
      try {
        const response = await api.get("/daily-expenses/chart", {
          params: { year, month },
        });
    const raw = response.data?.data || response.data || {};

    if (
      raw &&
      (Array.isArray(raw.dailyTrend) ||
        Array.isArray(raw.monthlyTrend) ||
        Array.isArray(raw.categoryBreakdown))
    ) {
      const dailyTrend: DailyTrendItem[] = (raw.dailyTrend || []).map((item: any) => ({
        date: String(item.date || ""),
        day: Number(item.day) || 1,
        dayOfWeek: String(item.dayOfWeek || ""),
        room: Number(item.room) || 0,
        own: Number(item.own) || 0,
        total: Number(item.total) || (Number(item.room) || 0) + (Number(item.own) || 0),
        count: Number(item.count) || 0,
      }));

      const monthlyTrend: MonthlyTrendItem[] = (raw.monthlyTrend || []).map((item: any) => ({
        year: Number(item.year) || year,
        month: Number(item.month) || 1,
        monthName: String(item.monthName || MONTH_NAMES_SHORT[(Number(item.month) || 1) - 1] || ""),
        room: Number(item.room) || 0,
        own: Number(item.own) || 0,
        total: Number(item.total) || (Number(item.room) || 0) + (Number(item.own) || 0),
        count: Number(item.count) || 0,
      }));

      const mapCat = (arr: any[]): CategoryBreakdownItem[] =>
        (arr || []).map((item: any) => ({
          category: String(item.category || "OTHER"),
          total: Number(item.total) || 0,
          room: item.room !== undefined ? Number(item.room) : undefined,
          own: item.own !== undefined ? Number(item.own) : undefined,
          percentage: item.percentage !== undefined ? Number(item.percentage) : undefined,
          count: item.count !== undefined ? Number(item.count) : undefined,
        }));

      const categoryBreakdown = mapCat(raw.categoryBreakdown || raw.monthCategoryBreakdown || []);
      const monthCategoryBreakdown = mapCat(raw.monthCategoryBreakdown || raw.categoryBreakdown || []);
      const yearCategoryBreakdown = mapCat(raw.yearCategoryBreakdown || []);

      const monthTotal =
        typeof raw.summary?.thisMonthAmount === "number"
          ? raw.summary.thisMonthAmount
          : dailyTrend.reduce((sum, d) => sum + d.total, 0);
      const monthRoom =
        typeof raw.summary?.thisMonthRoomAmount === "number"
          ? raw.summary.thisMonthRoomAmount
          : dailyTrend.reduce((sum, d) => sum + d.room, 0);
      const monthOwn =
        typeof raw.summary?.thisMonthOwnAmount === "number"
          ? raw.summary.thisMonthOwnAmount
          : dailyTrend.reduce((sum, d) => sum + d.own, 0);
      const yearTotal =
        typeof raw.summary?.totalAmount === "number"
          ? raw.summary.totalAmount
          : monthlyTrend.reduce((sum, m) => sum + m.total, 0);
      const yearRoom =
        typeof raw.summary?.roomAmount === "number"
          ? raw.summary.roomAmount
          : monthlyTrend.reduce((sum, m) => sum + m.room, 0);
      const yearOwn =
        typeof raw.summary?.ownAmount === "number"
          ? raw.summary.ownAmount
          : monthlyTrend.reduce((sum, m) => sum + m.own, 0);

      const activeDays = dailyTrend.filter((d) => d.total > 0).length;
      const dailyAverage = activeDays > 0 ? Math.round(monthTotal / activeDays) : 0;
      const activeMonths = monthlyTrend.filter((m) => m.total > 0).length;
      const monthlyAverage = activeMonths > 0 ? Math.round(yearTotal / activeMonths) : 0;

      return {
        dailyTrend,
        monthlyTrend,
        categoryBreakdown,
        monthCategoryBreakdown,
        yearCategoryBreakdown,
        selectedYear: raw.selectedYear || year,
        selectedMonth: raw.selectedMonth || month,
        summary: {
          monthTotal,
          monthRoom,
          monthOwn,
          yearTotal,
          yearRoom,
          yearOwn,
          dailyAverage,
          monthlyAverage,
          ...(raw.summary || {}),
        },
      };
    }
  } catch (err) {
    console.warn("Direct GET /daily-expenses/chart API call not available or failed, computing from expenses:", err);
  }

  // Resilient fallback: fetch all expenses and compute exact structure
  try {
    const listRes = await getDailyExpenses({ limit: 500 });
    const items = (listRes.items || []).filter((e) => e.status !== "REJECTED");

    // 1. dailyTrend: 1 to daysInMonth
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap = new Map<number, { room: number; own: number; total: number; count: number; dateStr: string; dayOfWeek: string }>();

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dailyMap.set(d, {
        room: 0,
        own: 0,
        total: 0,
        count: 0,
        dateStr,
        dayOfWeek: DAY_OF_WEEK_SHORT[dt.getDay()],
      });
    }

    // 2. monthlyTrend: 1 to 12
    const monthlyMap = new Map<number, { room: number; own: number; total: number; count: number; monthName: string }>();
    for (let m = 1; m <= 12; m++) {
      monthlyMap.set(m, {
        room: 0,
        own: 0,
        total: 0,
        count: 0,
        monthName: MONTH_NAMES_SHORT[m - 1],
      });
    }

    // 3. Category Breakdown accumulators (Monthly & Yearly)
    const monthCategoryMap = new Map<string, { total: number; count: number; room: number; own: number }>();
    const yearCategoryMap = new Map<string, { total: number; count: number; room: number; own: number }>();

    items.forEach((item) => {
      if (!item.expense_date) return;
      const itemDate = new Date(item.expense_date);
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth() + 1; // 1-12
      const itemDay = itemDate.getDate();
      const amt = Number(item.amount) || 0;
      const isRoom = item.expense_type === "room";

      let cat = item.category || "OTHER";
      if (cat === "Vakil/Masi" || cat === "VAKIL/MASI") {
        cat = "Lawyer/Aunty";
      }

      // Yearly trend aggregation
      if (itemYear === year && monthlyMap.has(itemMonth)) {
        const mObj = monthlyMap.get(itemMonth)!;
        mObj.total += amt;
        mObj.count += 1;
        if (isRoom) mObj.room += amt;
        else mObj.own += amt;

        const yEntry = yearCategoryMap.get(cat) || { total: 0, count: 0, room: 0, own: 0 };
        yEntry.total += amt;
        yEntry.count += 1;
        if (isRoom) yEntry.room += amt;
        else yEntry.own += amt;
        yearCategoryMap.set(cat, yEntry);
      }

      // Monthly / Daily trend aggregation
      if (itemYear === year && itemMonth === month && dailyMap.has(itemDay)) {
        const dObj = dailyMap.get(itemDay)!;
        dObj.total += amt;
        dObj.count += 1;
        if (isRoom) dObj.room += amt;
        else dObj.own += amt;

        const mEntry = monthCategoryMap.get(cat) || { total: 0, count: 0, room: 0, own: 0 };
        mEntry.total += amt;
        mEntry.count += 1;
        if (isRoom) mEntry.room += amt;
        else mEntry.own += amt;
        monthCategoryMap.set(cat, mEntry);
      }
    });

    const dailyTrend: DailyTrendItem[] = Array.from(dailyMap.entries()).map(([day, val]) => ({
      date: val.dateStr,
      day,
      dayOfWeek: val.dayOfWeek,
      room: val.room,
      own: val.own,
      total: val.total,
      count: val.count,
    }));

    const monthlyTrend: MonthlyTrendItem[] = Array.from(monthlyMap.entries()).map(([m, val]) => ({
      year,
      month: m,
      monthName: val.monthName,
      room: val.room,
      own: val.own,
      total: val.total,
      count: val.count,
    }));

    const monthTotal = dailyTrend.reduce((sum, d) => sum + d.total, 0);
    const monthCategoryBreakdown: CategoryBreakdownItem[] = Array.from(monthCategoryMap.entries()).map(([category, val]) => ({
      category,
      total: val.total,
      room: val.room,
      own: val.own,
      count: val.count,
      percentage: monthTotal > 0 ? Math.round((val.total / monthTotal) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    const monthRoom = dailyTrend.reduce((sum, d) => sum + d.room, 0);
    const monthOwn = dailyTrend.reduce((sum, d) => sum + d.own, 0);
    const yearTotal = monthlyTrend.reduce((sum, m) => sum + m.total, 0);
    const yearRoom = monthlyTrend.reduce((sum, m) => sum + m.room, 0);
    const yearOwn = monthlyTrend.reduce((sum, m) => sum + m.own, 0);

    const yearCategoryBreakdown: CategoryBreakdownItem[] = Array.from(yearCategoryMap.entries()).map(([category, val]) => ({
      category,
      total: val.total,
      room: val.room,
      own: val.own,
      count: val.count,
      percentage: yearTotal > 0 ? Math.round((val.total / yearTotal) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    const activeDays = dailyTrend.filter((d) => d.total > 0).length;
    const dailyAverage = activeDays > 0 ? Math.round(monthTotal / activeDays) : 0;
    const activeMonths = monthlyTrend.filter((m) => m.total > 0).length;
    const monthlyAverage = activeMonths > 0 ? Math.round(yearTotal / activeMonths) : 0;

    return {
      dailyTrend,
      monthlyTrend,
      categoryBreakdown: monthCategoryBreakdown,
      monthCategoryBreakdown,
      yearCategoryBreakdown,
      selectedYear: year,
      selectedMonth: month,
      summary: {
        monthTotal,
        monthRoom,
        monthOwn,
        yearTotal,
        yearRoom,
        yearOwn,
        dailyAverage,
        monthlyAverage,
      },
    };
  } catch (err) {
    console.error("Failed to generate fallback chart data:", err);
    return {
      dailyTrend: [],
      monthlyTrend: [],
      categoryBreakdown: [],
    };
  }
    },
    60000,
    forceRefresh
  );
}

