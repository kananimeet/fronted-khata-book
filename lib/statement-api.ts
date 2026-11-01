import api from "./api";
import { fetchWithDedupe } from "./api-cache";
import {
  StatementResponse,
  StatementQueryParams,
  StatementEntry,
} from "@/types/statement";
import { getExpenses } from "./expense-api";
import { getDailyExpenses } from "./daily-expense-api";

/**
 * Fetch Account Statement / Passbook with running balance and filters.
 * Connects to /api/v1/statement with local fallback if endpoint is starting up.
 */
export async function getStatement(
  params: StatementQueryParams = {},
  forceRefresh = false
): Promise<StatementResponse> {
  const cacheKey = `statement-${JSON.stringify(params)}`;

  return fetchWithDedupe(
    cacheKey,
    async () => {
      try {
        const response = await api.get("/statement", { params });
        const data = response.data?.data ?? response.data;
        if (data && data.items && data.summary) {
          return data as StatementResponse;
        }
      } catch (err) {
        console.warn("Backend /statement endpoint fallback to local computation:", err);
      }

      // Fallback: Compute statement on client from room expenses & daily expenses
      const [roomData, dailyRes] = await Promise.all([
        getExpenses({ page: 1, limit: 500 }, forceRefresh).catch(() => null),
        getDailyExpenses({ limit: 500, forceRefresh }).catch(() => null),
      ]);

      const roomItems = Array.isArray(roomData?.items)
        ? roomData.items
        : Array.isArray(roomData?.expenses)
        ? roomData.expenses
        : Array.isArray(roomData)
        ? roomData
        : [];

      const rawDaily: any = dailyRes;
      const dailyItems = Array.isArray(rawDaily?.items)
        ? rawDaily.items
        : Array.isArray(rawDaily?.data)
        ? rawDaily.data
        : Array.isArray(rawDaily)
        ? rawDaily
        : [];

      // Extract credits
      const credits: StatementEntry[] = [];
      roomItems.forEach((item: any) => {
        if (Array.isArray(item.payments) && item.payments.length > 0) {
          item.payments.forEach((p: any) => {
            if (p.status === "APPROVED") {
              const d = p.created_at || p.createdAt || item.created_at || item.createdAt;
              credits.push({
                id: `cr-${p.id}`,
                date: d,
                time: d,
                type: "CREDIT",
                amount: Number(p.amount) || 0,
                balance: 0,
                category: "Room Rent",
                note: (p.note || item.note || "Room Rent Payment").trim(),
                user: {
                  id: p.user?.id || p.user_id || item.user_id,
                  name: p.user?.name || item.user?.name || "Member",
                  email: p.user?.email || item.user?.email || "",
                  profile_picture: p.user?.profile_picture || item.user?.profile_picture,
                },
                referenceId: p.id,
                referenceType: "ROOM_RENT_PAYMENT",
              });
            }
          });
        } else if (item.status === "COMPLETE" || item.status === "REMAINING") {
          const paid = Number(item.paid_amount) || 0;
          if (paid > 0) {
            const d = item.created_at || item.createdAt;
            credits.push({
              id: `cr-${item.id}`,
              date: d,
              time: d,
              type: "CREDIT",
              amount: paid,
              balance: 0,
              category: "Room Rent",
              note: (item.note || "Room Rent Payment").trim(),
              user: {
                id: item.user?.id || item.user_id,
                name: item.user?.name || "Member",
                email: item.user?.email || "",
                profile_picture: item.user?.profile_picture,
              },
              referenceId: item.id,
              referenceType: "ROOM_RENT_PAYMENT",
            });
          }
        }
      });

      // Extract debits
      const debits: StatementEntry[] = [];
      dailyItems.forEach((e: any) => {
        if (
          (e.expense_type === "room" || e.category === "room") &&
          e.status === "APPROVED"
        ) {
          const d = e.created_at || e.createdAt || e.expense_date;
          debits.push({
            id: `dr-${e.id}`,
            date: d,
            time: d,
            type: "DEBIT",
            amount: Number(e.amount) || 0,
            balance: 0,
            category: e.category || "Groceries",
            note: (e.note || e.category || "Room Expense").trim(),
            user: {
              id: e.user?.id || e.user_id,
              name: e.user?.name || "Roommate",
              email: e.user?.email || "",
              profile_picture: e.user?.profile_picture,
            },
            payment_photo: e.payment_photo,
            referenceId: e.id,
            referenceType: "DAILY_ROOM_EXPENSE",
          });
        }
      });

      // Merge and sort ascending
      const allChronological = [...credits, ...debits].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return timeA - timeB;
      });

      let running = 0;
      for (const item of allChronological) {
        if (item.type === "CREDIT") running += item.amount;
        else running -= item.amount;
        item.balance = Math.round(running * 100) / 100;
      }

      // Date filtering
      let fromTime: number | null = null;
      let toTime: number | null = null;
      if (params.year && params.month) {
        fromTime = new Date(params.year, params.month - 1, 1).getTime();
        toTime = new Date(params.year, params.month, 0, 23, 59, 59, 999).getTime();
      } else {
        if (params.startDate) fromTime = new Date(params.startDate).setHours(0, 0, 0, 0);
        if (params.endDate) toTime = new Date(params.endDate).setHours(23, 59, 59, 999);
      }

      let openingBalance = 0;
      if (fromTime !== null) {
        const priors = allChronological.filter(
          (e) => new Date(e.date).getTime() < fromTime!
        );
        if (priors.length > 0) openingBalance = priors[priors.length - 1].balance;
      }

      let filtered = allChronological;
      if (fromTime !== null) {
        filtered = filtered.filter((e) => new Date(e.date).getTime() >= fromTime!);
      }
      if (toTime !== null) {
        filtered = filtered.filter((e) => new Date(e.date).getTime() <= toTime!);
      }

      let periodCredit = 0;
      let periodDebit = 0;
      for (const it of filtered) {
        if (it.type === "CREDIT") periodCredit += it.amount;
        else periodDebit += it.amount;
      }

      const closingBalance =
        filtered.length > 0
          ? filtered[filtered.length - 1].balance
          : openingBalance;

      if (params.type && params.type !== "ALL") {
        filtered = filtered.filter((e) => e.type === params.type);
      }
      if (params.user_id && params.user_id !== "all") {
        filtered = filtered.filter((e) => e.user?.id === params.user_id);
      }
      if (params.search) {
        const s = params.search.toLowerCase().trim();
        filtered = filtered.filter(
          (e) =>
            e.note?.toLowerCase().includes(s) ||
            e.category?.toLowerCase().includes(s) ||
            e.user?.name?.toLowerCase().includes(s)
        );
      }

      const isDesc = params.sortOrder === "DESC";
      const sortedDisplay = [...filtered].sort((a, b) =>
        isDesc
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const isAll = params.all === true || params.limit === 0 || params.limit === -1;
      const total = sortedDisplay.length;
      let page = 1;
      let limit = total;
      let totalPages = 1;
      let itemsToReturn = sortedDisplay;

      if (!isAll) {
        page = Math.max(1, params.page || 1);
        limit = Math.max(1, params.limit || 20);
        totalPages = Math.max(1, Math.ceil(total / limit));
        const start = (page - 1) * limit;
        itemsToReturn = sortedDisplay.slice(start, start + limit);
      }

      return {
        summary: {
          openingBalance: Math.round(openingBalance * 100) / 100,
          closingBalance: Math.round(closingBalance * 100) / 100,
          totalCredit: Math.round(periodCredit * 100) / 100,
          totalDebit: Math.round(periodDebit * 100) / 100,
          netChange: Math.round((periodCredit - periodDebit) * 100) / 100,
          totalTransactions: total,
          currentPoolBalance: Math.round(running * 100) / 100,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        items: itemsToReturn,
      };
    },
    15000,
    forceRefresh
  );
}

