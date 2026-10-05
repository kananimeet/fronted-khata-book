"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
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
} from "lucide-react";

export default function DailyExpensesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

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

  // Hydrate from localStorage strictly on client post-hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const item = localStorage.getItem("khatabook_daily_expenses_cache");
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

    getExpenses({ page: 1, limit: 1 })
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
          limit: pageSize,
          search: debouncedSearch.trim() || undefined,
          forceRefresh: showRefreshSpinner,
        };

        const res = await getDailyExpenses(queryParams);

        startTransition(() => {
          setExpenses(res.items || []);
          setSummary(res.summary);
          setTotalItems(res.pagination.total || 0);
          setCurrentPage(res.pagination.page || pageToLoad);
          setTotalPages(res.pagination.totalPages || 1);
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
                "khatabook_daily_expenses_cache",
                JSON.stringify({
                  items: res.items,
                  summary: res.summary,
                  total: res.pagination.total,
                  totalPages: res.pagination.totalPages,
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
    [filters, debouncedSearch, toast]
  );

  // Re-fetch on filter changes or debounced search change
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
    fetchExpenses,
  ]);

  // Filter modification handler
  const handleFilterChange = (newFilters: Partial<DailyExpenseFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Reset filters handler
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
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Daily Expenses & Groceries
              </h1>
              <Badge
                variant={isAdmin ? "default" : "secondary"}
                className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5"
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
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isAdmin
                ? "Review room grocery bills, approve rent liability deductions, and manage expenses."
                : "Submit room groceries to reduce your rent liability or track personal spending."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchExpenses(currentPage, true)}
            disabled={isLoading || isRefreshing}
            title="Refresh expenses"
            aria-label="Refresh expenses"
            className="h-9 w-9"
          >
            <RotateCw
              className={`h-4 w-4 ${
                isRefreshing ? "animate-spin text-primary" : ""
              }`}
            />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="gap-2 font-semibold shadow-xs h-9 text-xs"
          >
            <Plus className="h-4 w-4" />
            Add New Expense
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
        onPageChange={(page) => handleFilterChange({ page })}
        isLoading={isLoading}
      />

      {/* 7. Create / Edit Dialog Modal */}
      <DailyExpenseCreateEditDialog
        open={createEditDialogOpen}
        onOpenChange={setCreateEditDialogOpen}
        expenseToEdit={expenseToEdit}
        onSuccess={() => fetchExpenses(currentPage, true)}
      />

      {/* 8. Details Dialog Modal */}
      <DailyExpenseDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        expense={selectedExpenseForDetails}
        isAdmin={isAdmin}
        currentUserId={currentUser?.id}
        onEditExpense={handleOpenEdit}
        onDeleteExpense={handleOpenDelete}
        onApproveExpense={handleOpenApprove}
        onRejectExpense={handleOpenReject}
        onPreviewReceipt={handleOpenReceipt}
      />

      {/* 9. Admin Approve / Reject Dialog Modal */}
      <DailyExpenseActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        expense={actionExpense}
        actionType={actionType}
        onSuccess={() => fetchExpenses(currentPage, true)}
      />

      {/* 10. Delete Confirmation Dialog */}
      <DailyExpenseDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        expense={expenseToDelete}
        onSuccess={() => fetchExpenses(currentPage, true)}
      />

      {/* 11. Receipt Preview Lightbox Modal */}
      <DailyExpenseReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        expense={receiptExpense}
      />
    </div>
  );
}
