"use client";

import React, { Suspense, useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Receipt,
  PlusCircle,
  Search,
  RotateCw,
  Filter,
  X,
  Shield,
  UserCheck,
  LayoutList,
  Users,
  IndianRupee,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api";
import {
  getExpenses,
  getUserExpenseTotals,
} from "@/lib/expense-api";
import {
  Expense,
  ExpenseStatus,
  UserExpenseTotalsItem,
  GrandSummary,
} from "@/types/expense";

import { ExpenseStats } from "@/components/expenses/expense-stats";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import { ExpensesPagination } from "@/components/expenses/expenses-pagination";
import { UserTotalsView } from "@/components/expenses/user-totals-view";
import { ExpenseCreateDialog } from "@/components/expenses/expense-create-dialog";
import { ExpensePayDialog } from "@/components/expenses/expense-pay-dialog";
import { ExpenseDetailsDialog } from "@/components/expenses/expense-details-dialog";
import { ExpenseApproveDialog } from "@/components/expenses/expense-approve-dialog";
import { ExpenseRejectDialog } from "@/components/expenses/expense-reject-dialog";
import { ExpenseEditDialog } from "@/components/expenses/expense-edit-dialog";
import { ExpenseDeleteDialog } from "@/components/expenses/expense-delete-dialog";

function ExpensesContent() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  // Tab State for Admin: 'requests' | 'totals'
  const initialTab = searchParams.get("tab") === "totals" ? "totals" : "requests";
  const [activeTab, setActiveTab] = useState<"requests" | "totals">(initialTab);

  // Sync tab with URL if search param changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "totals" && activeTab !== "totals") {
      setActiveTab("totals");
    } else if (tabParam === "requests" && activeTab !== "requests") {
      setActiveTab("requests");
    }
  }, [searchParams, activeTab]);

  // Expenses List State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;

  // Filter States
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Summary stats for normal user or all expenses
  const [summaryStats, setSummaryStats] = useState({
    totalRoomRate: 0,
    totalApproved: 0,
    totalPending: 0,
    totalRemaining: 0,
  });

  // Admin User Totals State
  const [userTotals, setUserTotals] = useState<UserExpenseTotalsItem[]>([]);
  const [grandSummary, setGrandSummary] = useState<GrandSummary | null>(null);
  const [isLoadingTotals, setIsLoadingTotals] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Hydrate from localStorage strictly on client post-hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const item = localStorage.getItem("khatabook_room_expenses_cache");
      if (item) {
        const cached = JSON.parse(item);
        if (cached?.items && Array.isArray(cached.items) && cached.items.length > 0) {
          setExpenses(cached.items);
          if (cached.summary) setSummaryStats(cached.summary);
          if (typeof cached.total === "number") setTotalExpenses(cached.total);
          if (typeof cached.totalPages === "number") setTotalPages(cached.totalPages);
          setIsLoading(false);
        }
      }
    } catch {}
  }, []);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [payDialogOpen, setPayDialogOpen] = useState<boolean>(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState<boolean>(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // 300ms Debounce for Search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Helper to calculate summary numbers if backend does not return summary object
  const calculateClientSummary = useCallback((items: Expense[]) => {
    let roomRate = 0;
    let approved = 0;
    let pending = 0;
    let remaining = 0;

    items.forEach((item) => {
      roomRate += Number(item.total_amount) || 0;
      approved += Number(item.paid_amount) || 0;
      if (item.status === "PENDING") {
        pending += Number(item.pay_amount) || 0;
      } else {
        const pendingP = item.payments?.find((p) => p.status === "PENDING");
        if (pendingP) {
          pending += Number(pendingP.amount) || 0;
        }
      }
      remaining += Number(item.remaining_amount) || 0;
    });

    const summary = {
      totalRoomRate: roomRate,
      totalApproved: approved,
      totalPending: pending,
      totalRemaining: remaining,
    };
    setSummaryStats(summary);
    return summary;
  }, []);

  // Fetch Expenses List
  const fetchExpensesList = useCallback(
    async (
      page = 1,
      showRefreshSpinner = false,
      overrideSearch?: string,
      overrideStatus?: string
    ) => {
      if (showRefreshSpinner) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const activeSearch =
          overrideSearch !== undefined ? overrideSearch : debouncedSearch;
        const activeStatus =
          overrideStatus !== undefined ? overrideStatus : statusFilter;

        const params: Record<string, string | number> = {
          page,
          limit: pageSize,
        };

        if (activeSearch.trim()) {
          params.search = activeSearch.trim();
        }

        if (activeStatus !== "ALL") {
          params.status = activeStatus;
        }

        const data = await getExpenses(params, showRefreshSpinner);

        if (data) {
          // Extract items: backend returns { items: [...], meta: {...}, summary: {...} }
          let items: Expense[] = [];
          if (Array.isArray(data)) {
            items = data;
          } else if (Array.isArray(data.items)) {
            items = data.items;
          } else if (Array.isArray(data.expenses)) {
            items = data.expenses;
          } else if (Array.isArray(data.data)) {
            items = data.data;
          } else if (Array.isArray(data.rows)) {
            items = data.rows;
          }

          // Total count from meta or total property
          const totalCount =
            typeof data.meta?.total === "number"
              ? data.meta.total
              : typeof data.total === "number"
              ? data.total
              : typeof data.totalCount === "number"
              ? data.totalCount
              : items.length;

          // Page number
          const pageNum =
            typeof data.meta?.page === "number"
              ? data.meta.page
              : typeof data.page === "number"
              ? data.page
              : page;

          // Total pages
          const pagesCount =
            typeof data.meta?.totalPages === "number"
              ? data.meta.totalPages
              : typeof data.totalPages === "number"
              ? data.totalPages
              : Math.max(1, Math.ceil(totalCount / pageSize));

          startTransition(() => {
            setExpenses(items);
            setTotalExpenses(totalCount);
            setCurrentPage(pageNum);
            setTotalPages(pagesCount);
          });

          // Include any pending installment amounts from items
          const additionalPendingInstallments = items.reduce((acc, it) => {
            if (it.status === "PENDING") return acc;
            const p = it.payments?.find((pay) => pay.status === "PENDING");
            if (p) return acc + (Number(p.amount) || 0);
            return acc;
          }, 0);

          // Summary stats (supports both totalRoomRate and totalRoomRateAmount naming)
          let currentSummary = null;
          if (data.summary) {
            const rawPending =
              Number(
                data.summary.totalPending ??
                  data.summary.totalPendingAmount
              ) || 0;

            currentSummary = {
              totalRoomRate:
                Number(
                  data.summary.totalRoomRate ??
                    data.summary.totalRoomRateAmount
                ) || 0,
              totalApproved:
                Number(
                  data.summary.totalApproved ??
                    data.summary.totalApprovedAmount
                ) || 0,
              totalPending: rawPending + additionalPendingInstallments,
              totalRemaining:
                Number(
                  data.summary.totalRemaining ??
                    data.summary.totalRemainingAmount
                ) || 0,
            };
            setSummaryStats(currentSummary);
          } else {
            currentSummary = calculateClientSummary(items);
          }

          // Cache first page default list for instant display next time
          if (!activeSearch.trim() && activeStatus === "ALL" && page === 1) {
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(
                  "khatabook_room_expenses_cache",
                  JSON.stringify({
                    items,
                    total: totalCount,
                    totalPages: pagesCount,
                    summary: currentSummary,
                  })
                );
              } catch {}
            }
          }
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load expense requests."));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, statusFilter, toast, calculateClientSummary]
  );

  // Fetch User Totals (Admin View)
  const fetchUserTotals = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingTotals(true);

    try {
      const data = await getUserExpenseTotals();
      if (data) {
        const usersList =
          data.users ||
          data.items ||
          (Array.isArray(data) ? data : []);
        setUserTotals(usersList);
        setGrandSummary(data.grandSummary || null);
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to load user totals dashboard."));
    } finally {
      setIsLoadingTotals(false);
    }
  }, [isAdmin, toast]);

  // Initial and reactive data fetching
  useEffect(() => {
    if (activeTab === "requests") {
      fetchExpensesList(currentPage);
    } else if (activeTab === "totals" && isAdmin) {
      fetchUserTotals();
    }
  }, [currentPage, debouncedSearch, statusFilter, activeTab, isAdmin, fetchExpensesList, fetchUserTotals]);

  // Tab switch handler
  const handleTabChange = (tab: "requests" | "totals") => {
    setActiveTab(tab);
    router.replace(`/expenses?tab=${tab}`);
  };

  // Dialog Triggers
  const handlePayRemainingClick = (exp: Expense) => {
    setSelectedExpense(exp);
    setPayDialogOpen(true);
  };

  const handleViewDetailsClick = (exp: Expense) => {
    setSelectedExpense(exp);
    setDetailsDialogOpen(true);
  };

  const handleApproveClick = (exp: Expense) => {
    setSelectedExpense(exp);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (exp: Expense) => {
    setSelectedExpense(exp);
    setRejectDialogOpen(true);
  };

  const handleEditClick = (exp: Expense) => {
    setSelectedExpense(exp);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (exp: Expense) => {
    setSelectedExpense(exp);
    setDeleteDialogOpen(true);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setCurrentPage(1);
    fetchExpensesList(1, false, "", "ALL");
  };

  const hasActiveFilters = Boolean(searchInput.trim() || statusFilter !== "ALL");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {isAdmin
                    ? "Room Rate & Expense Management"
                    : "My Room Rent & Expenses"}
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
                  ? "Track user room expenses, approve installment payments, and view real-time totals."
                  : "Submit room rent requests, pay remaining balances, and view your payment history."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (activeTab === "requests") fetchExpensesList(currentPage, true);
              else fetchUserTotals();
            }}
            disabled={isLoading || isRefreshing || isLoadingTotals}
            title="Refresh data"
            className="h-9 w-9"
          >
            <RotateCw
              className={`h-4 w-4 ${isRefreshing || isLoadingTotals ? "animate-spin text-primary" : ""
                }`}
            />
          </Button>

          {/* Room Rent Request Button */}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2 font-semibold shadow-xs h-9 bg-primary"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Room Rent Request</span>
          </Button>
        </div>
      </div>

      {/* Admin Tab Switcher: "All Requests" vs "User Totals Dashboard" */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => handleTabChange("requests")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "requests"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <LayoutList className="h-4 w-4" />
            <span>All Requests</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("totals")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "totals"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <Users className="h-4 w-4" />
            <span>User Totals Dashboard</span>
          </button>
        </div>
      )}

      {/* TAB 1: ALL REQUESTS VIEW (Both User and Admin) */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <ExpenseStats
            totalRoomRate={summaryStats.totalRoomRate}
            totalApproved={summaryStats.totalApproved}
            totalPending={summaryStats.totalPending}
            totalRemaining={summaryStats.totalRemaining}
            titlePrefix="Total"
          />

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by user, note, or remarks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 bg-background"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex items-center">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-background pl-9 pr-8 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all cursor-pointer"
                >
                  <option value="ALL">Status: All</option>
                  <option value="PENDING">PENDING (Yellow)</option>
                  <option value="REMAINING">REMAINING (Blue)</option>
                  <option value="COMPLETE">COMPLETE (Green)</option>
                  <option value="REJECTED">REJECTED (Red)</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs h-9 px-2 text-muted-foreground hover:text-destructive"
                  title="Reset all filters"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Expenses Table */}
          <ExpensesTable
            expenses={expenses}
            isLoading={isLoading}
            isAdmin={isAdmin}
            currentUserId={currentUser?.id}
            onPayRemaining={handlePayRemainingClick}
            onViewDetails={handleViewDetailsClick}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />

          {/* Pagination */}
          <ExpensesPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalExpenses}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* TAB 2: USER TOTALS DASHBOARD VIEW (Admin Only) */}
      {isAdmin && activeTab === "totals" && (
        <UserTotalsView
          users={userTotals}
          grandSummary={grandSummary}
          isLoading={isLoadingTotals}
          onRefresh={fetchUserTotals}
          onViewExpense={handleViewDetailsClick}
          onApproveExpense={handleApproveClick}
          onRejectExpense={handleRejectClick}
        />
      )}

      {/* Modals & Dialogs */}
      {/* 1. Create New Expense Dialog */}
      <ExpenseCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        isAdmin={isAdmin}
        onExpenseCreated={() => {
          setSearchInput("");
          setDebouncedSearch("");
          setStatusFilter("ALL");
          setCurrentPage(1);
          fetchExpensesList(1, false, "", "ALL");
          if (isAdmin) fetchUserTotals();
        }}
      />

      {/* 2. Pay Remaining Installment Dialog */}
      <ExpensePayDialog
        expense={selectedExpense}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        onPaymentSubmitted={() => {
          fetchExpensesList(currentPage, true);
          if (isAdmin) fetchUserTotals();
        }}
      />

      {/* 3. Expense Details & History Dialog */}
      <ExpenseDetailsDialog
        expense={selectedExpense}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        isAdmin={isAdmin}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        canPayRemaining={
          !isAdmin &&
          Boolean(currentUser?.id) &&
          String(selectedExpense?.user_id) === String(currentUser?.id)
        }
        onPayRemaining={handlePayRemainingClick}
      />

      {/* 4. Admin Approve Dialog */}
      {isAdmin && (
        <ExpenseApproveDialog
          expense={selectedExpense}
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          onApproved={() => {
            fetchExpensesList(currentPage, true);
            fetchUserTotals();
          }}
        />
      )}

      {/* 5. Admin Reject Dialog */}
      {isAdmin && (
        <ExpenseRejectDialog
          expense={selectedExpense}
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          onRejected={() => {
            fetchExpensesList(currentPage, true);
            fetchUserTotals();
          }}
        />
      )}

      {/* 6. Admin Edit Dialog */}
      {isAdmin && (
        <ExpenseEditDialog
          expense={selectedExpense}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdated={() => {
            fetchExpensesList(currentPage, true);
            fetchUserTotals();
          }}
        />
      )}

      {/* 7. Admin Delete Dialog */}
      {isAdmin && (
        <ExpenseDeleteDialog
          expense={selectedExpense}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleted={() => {
            fetchExpensesList(currentPage, true);
            fetchUserTotals();
          }}
        />
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Loading expenses...</p>
          </div>
        </div>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}

