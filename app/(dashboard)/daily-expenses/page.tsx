"use client";

import React, { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DailyExpense,
  DailyExpenseFilterParams,
  DailyExpenseSummary,
} from "@/types/daily-expense";
import { User } from "@/types/auth";
import { getDailyExpenses } from "@/lib/daily-expense-api";
import { getExpenses, getUsersForExpenseSelect } from "@/lib/expense-api";
import { getApiErrorMessage } from "@/lib/api";

import { DailyExpenseStats } from "@/components/daily-expenses/daily-expense-stats";
import { DailyExpenseFilters } from "@/components/daily-expenses/daily-expense-filters";
import { DailyExpenseTable } from "@/components/daily-expenses/daily-expense-table";
import { DailyExpenseCardList } from "@/components/daily-expenses/daily-expense-card-list";
import { DailyExpensePagination } from "@/components/daily-expenses/daily-expense-pagination";
import { DailyExpenseCreateEditDialog } from "@/components/daily-expenses/daily-expense-create-edit-dialog";
import { DailyExpenseDetailsDialog } from "@/components/daily-expenses/daily-expense-details-dialog";
import { DailyExpenseActionDialog } from "@/components/daily-expenses/daily-expense-action-dialog";
import { DailyExpenseDeleteDialog } from "@/components/daily-expenses/daily-expense-delete-dialog";
import { DailyExpenseReceiptModal } from "@/components/daily-expenses/daily-expense-receipt-modal";

import {
  Receipt,
  Plus,
  RotateCw,
  Shield,
  UserCheck,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
} from "lucide-react";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function DailyExpensesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed
  const [isAllTime, setIsAllTime] = useState<boolean>(false);

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  // Data states (Consistent initial values for SSR & client)
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [summary, setSummary] = useState<DailyExpenseSummary>({
    totalAmount: 0,
    totalRoomAmount: 0,
    totalOwnAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });

  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;

  // Filter state
  const [filters, setFilters] = useState<DailyExpenseFilterParams>({
    page: 1,
    limit: pageSize,
    search: "",
    expense_type: "all",
    status: "all",
    category: "all",
    user_id: "all",
    startDate: "",
    endDate: "",
  });

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Admin users list for dropdown
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [totalApprovedPaid, setTotalApprovedPaid] = useState<number>(0);

  // Check if active selection is current month
  const isCurrentMonthSelected =
    !isAllTime &&
    selectedYear === currentDate.getFullYear() &&
    selectedMonth === currentDate.getMonth();

  // Hydrate from localStorage strictly on client post-hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const item =
        localStorage.getItem("bachelorsbook_daily_expenses_cache") ||
        localStorage.getItem("khatabook_daily_expenses_cache");
      if (item) {
        const cached = JSON.parse(item);
        if (cached?.items && Array.isArray(cached.items) && cached.items.length > 0) {
          setExpenses(cached.items);
          if (cached.summary) setSummary(cached.summary);
          if (typeof cached.total === "number") setTotalItems(cached.total);
          if (typeof cached.totalPages === "number") setTotalPages(cached.totalPages);
          setIsLoading(false);
        }
      }
    } catch {}
  }, []);

  // Dialog states
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<DailyExpense | null>(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionExpense, setActionExpense] = useState<DailyExpense | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<DailyExpense | null>(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<DailyExpense | null>(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptExpense, setReceiptExpense] = useState<DailyExpense | null>(null);

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || "");
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Load users list for filtering and room expenses pool
  useEffect(() => {
    let isMounted = true;
    setIsLoadingUsers(true);
    getUsersForExpenseSelect()
      .then((fetchedUsers) => {
        if (isMounted) setUsers(fetchedUsers);
      })
      .catch((err) => {
        console.warn("Could not load users for daily expenses filter:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingUsers(false);
      });

    getExpenses({ page: 1, limit: 100 })
      .then((data) => {
        if (!isMounted || !data) return;
        const approved =
          Number(data.summary?.totalApproved ?? data.summary?.totalApprovedAmount) || 0;
        if (approved > 0) setTotalApprovedPaid(approved);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Daily Expenses
  const fetchExpenses = useCallback(
    async (pageToLoad = 1, showRefreshSpinner = false) => {
      if (showRefreshSpinner) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const queryParams: DailyExpenseFilterParams = {
          ...filters,
          page: pageToLoad,
          limit: isAllTime ? pageSize : 500,
          search: debouncedSearch.trim() || undefined,
          forceRefresh: showRefreshSpinner,
        };

        if (!isAllTime && !filters.startDate) {
          const mStr = String(selectedMonth + 1).padStart(2, "0");
          queryParams.startDate = `${selectedYear}-${mStr}-01`;
          const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
          queryParams.endDate = `${selectedYear}-${mStr}-${String(lastDay).padStart(2, "0")}`;
        }

        const res = await getDailyExpenses(queryParams);

        let items: DailyExpense[] = res.items || [];
        let curSummary: DailyExpenseSummary = res.summary;

        // Apply strict client-side month filter if viewing a specific month
        if (!isAllTime) {
          items = items.filter((item) => {
            const raw = item.expense_date || item.created_at;
            if (!raw) return false;
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
            }
            const parts = String(raw).split("T")[0].split("-");
            if (parts.length >= 2) {
              return (
                parseInt(parts[0], 10) === selectedYear &&
                parseInt(parts[1], 10) - 1 === selectedMonth
              );
            }
            return false;
          });

          const approvedItems = items.filter((i) => i.status === "APPROVED");
          const approvedRoom = approvedItems.filter(
            (i) => i.expense_type === "room" || (i as any).category === "room"
          );
          const approvedOwn = approvedItems.filter(
            (i) => i.expense_type === "own" || (i as any).category === "own"
          );
          const pendingItems = items.filter((i) => i.status === "PENDING");
          const rejectedItems = items.filter((i) => i.status === "REJECTED");

          curSummary = {
            totalAmount: approvedItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
            totalRoomAmount: approvedRoom.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
            totalOwnAmount: approvedOwn.reduce((sum, i) => sum + (Number(i.amount) || 0), 0),
            approvedCount: approvedItems.length,
            pendingCount: pendingItems.length,
            rejectedCount: rejectedItems.length,
          };
        }

        const totalCount = isAllTime
          ? res.pagination?.total || items.length
          : items.length;
        const totalPgs = isAllTime
          ? res.pagination?.totalPages || 1
          : Math.max(1, Math.ceil(items.length / pageSize));

        startTransition(() => {
          setExpenses(items);
          setSummary(curSummary);
          setTotalItems(totalCount);
          setCurrentPage(pageToLoad);
          setTotalPages(totalPgs);
        });

        // Cache first page default list for instant display next time
        if (
          !filters.search &&
          filters.status === "all" &&
          filters.expense_type === "all" &&
          filters.category === "all" &&
          pageToLoad === 1
        ) {
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                "bachelorsbook_daily_expenses_cache",
                JSON.stringify({
                  items,
                  summary: curSummary,
                  total: totalCount,
                  totalPages: totalPgs,
                })
              );
            } catch {}
          }
        }
      } catch (err: unknown) {
        toast.error(
          getApiErrorMessage(err, "Failed to load daily expenses records")
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, debouncedSearch, toast, isAllTime, selectedYear, selectedMonth]
  );

  // Month navigation handlers
  const handlePrevMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetMonth = () => {
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
    setIsAllTime(false);
  };

  const handleToggleAllTime = () => {
    setIsAllTime((prev) => !prev);
  };

  // Re-fetch on filter changes or debounced search change or month change
  useEffect(() => {
    fetchExpenses(filters.page || 1);
  }, [
    filters.page,
    filters.expense_type,
    filters.status,
    filters.category,
    filters.user_id,
    filters.startDate,
    filters.endDate,
    debouncedSearch,
    selectedYear,
    selectedMonth,
    isAllTime,
    fetchExpenses,
  ]);

  // Filter modification handler
  const handleFilterChange = (newFilters: Partial<DailyExpenseFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: pageSize,
      search: "",
      expense_type: "all",
      status: "all",
      category: "all",
      user_id: "all",
      startDate: "",
      endDate: "",
    });
  };

  // Handlers for Dialogs
  const handleOpenCreate = () => {
    setExpenseToEdit(null);
    setCreateEditDialogOpen(true);
  };

  const handleOpenEdit = (expense: DailyExpense) => {
    setExpenseToEdit(expense);
    setCreateEditDialogOpen(true);
  };

  const handleOpenApprove = (expense: DailyExpense) => {
    setActionExpense(expense);
    setActionType("approve");
    setActionDialogOpen(true);
  };

  const handleOpenReject = (expense: DailyExpense) => {
    setActionExpense(expense);
    setActionType("reject");
    setActionDialogOpen(true);
  };

  const handleOpenDelete = (expense: DailyExpense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleOpenReceipt = (expense: DailyExpense) => {
    setReceiptExpense(expense);
    setReceiptModalOpen(true);
  };

  const handleOpenDetails = (expense: DailyExpense) => {
    setSelectedExpenseForDetails(expense);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/50 dark:ring-white/10 shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Daily Expenses & Groceries
              </h1>
              <Badge
                variant={isAdmin ? "default" : "secondary"}
                className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
              >
                {isAdmin ? (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Admin View
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> Member View
                  </span>
                )}
              </Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <Calendar className="h-3 w-3" />
                {isAllTime
                  ? "All Time"
                  : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              {isAllTime
                ? "Viewing all daily grocery expenses and room bills across all time."
                : `Live summary & expenses for ${MONTH_NAMES_FULL[selectedMonth]} ${selectedYear}.`}
            </p>
          </div>
        </div>

        {/* Action Buttons: Month Navigator, Refresh & Create Expense */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Month Selector */}
          <div className="flex items-center p-1 rounded-xl glass-pill border border-white/60 dark:border-white/10 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              title="Previous Month"
              aria-label="Previous Month"
              className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={handleToggleAllTime}
              title={isAllTime ? "Switch to monthly view" : "Switch to all-time view"}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Calendar className="h-3.5 w-3.5 text-violet-500" />
              <span>
                {isAllTime
                  ? "All Time"
                  : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
              </span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              title="Next Month"
              aria-label="Next Month"
              className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {(!isCurrentMonthSelected || isAllTime) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetMonth}
                title="Reset to current month"
                aria-label="Reset to current month"
                className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchExpenses(currentPage, true)}
            disabled={isLoading || isRefreshing}
            title="Refresh expenses"
            aria-label="Refresh expenses"
            className="h-10 w-10 rounded-xl glass-pill shadow-xs hover:border-violet-500/40 cursor-pointer"
          >
            <RotateCw
              className={`h-4 w-4 ${
                isRefreshing ? "animate-spin text-violet-600" : "text-muted-foreground hover:text-foreground"
              }`}
            />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="h-10 px-4 rounded-xl gap-2 font-bold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add New Expense</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Stat Summary Cards */}
      <DailyExpenseStats
        summary={summary}
        isLoading={isLoading}
        totalApprovedPaid={totalApprovedPaid}
      />

      {/* 3. Quick Tabs & Detailed Filter Controls */}
      <DailyExpenseFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        isAdmin={isAdmin}
        users={users}
        isLoadingUsers={isLoadingUsers}
      />

      {/* 4. Expenses List: Desktop Table (hidden on mobile) */}
      <div className="hidden md:block">
        <DailyExpenseTable
          expenses={expenses}
          isLoading={isLoading}
          isAdmin={isAdmin}
          currentUserId={currentUser?.id}
          onViewExpense={handleOpenDetails}
          onEditExpense={handleOpenEdit}
          onDeleteExpense={handleOpenDelete}
          onApproveExpense={handleOpenApprove}
          onRejectExpense={handleOpenReject}
          onPreviewReceipt={handleOpenReceipt}
        />
      </div>

      {/* 5. Expenses List: Mobile Card List (visible only on mobile) */}
      <div className="block md:hidden">
        <DailyExpenseCardList
          expenses={expenses}
          isLoading={isLoading}
          isAdmin={isAdmin}
          currentUserId={currentUser?.id}
          onViewExpense={handleOpenDetails}
          onEditExpense={handleOpenEdit}
          onDeleteExpense={handleOpenDelete}
          onApproveExpense={handleOpenApprove}
          onRejectExpense={handleOpenReject}
          onPreviewReceipt={handleOpenReceipt}
        />
      </div>

      {/* 6. Pagination */}
      <DailyExpensePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(page) => fetchExpenses(page)}
        isLoading={isLoading}
      />

      {/* Dialogs */}
      <DailyExpenseCreateEditDialog
        open={createEditDialogOpen}
        onOpenChange={setCreateEditDialogOpen}
        expenseToEdit={expenseToEdit}
        onSuccess={() => fetchExpenses(currentPage, true)}
      />

      <DailyExpenseActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        expense={actionExpense}
        actionType={actionType}
        onSuccess={() => fetchExpenses(currentPage, true)}
      />

      <DailyExpenseDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        expense={expenseToDelete}
        onSuccess={() => fetchExpenses(currentPage, true)}
      />

      <DailyExpenseDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        expense={selectedExpenseForDetails}
        onEditExpense={handleOpenEdit}
        onDeleteExpense={handleOpenDelete}
        onApproveExpense={(exp: DailyExpense) => handleOpenApprove(exp)}
        onRejectExpense={(exp: DailyExpense) => handleOpenReject(exp)}
        onPreviewReceipt={handleOpenReceipt}
        isAdmin={isAdmin}
        currentUserId={currentUser?.id}
      />

      <DailyExpenseReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        expense={receiptExpense}
      />
    </div>
  );
}
