"use client";

import React, { Suspense, useState, useEffect, useCallback, useTransition, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
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

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function ExpensesContent() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed
  const [isAllTime, setIsAllTime] = useState<boolean>(false);

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

  const isCurrentMonthSelected =
    !isAllTime &&
    selectedYear === currentDate.getFullYear() &&
    selectedMonth === currentDate.getMonth();

  // Hydrate from localStorage strictly on client post-hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const item =
        localStorage.getItem("bachelorsbook_room_expenses_cache") ||
        localStorage.getItem("khatabook_room_expenses_cache");
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
      // Room Rate and Remaining should only count approved/active requests (COMPLETE or REMAINING)
      if (item.status === "COMPLETE" || item.status === "REMAINING") {
        roomRate += Number(item.total_amount) || 0;
        remaining += Number(item.remaining_amount) || 0;
      }
      approved += Number(item.paid_amount) || 0;
      if (item.status === "PENDING") {
        pending += Number(item.pay_amount) || 0;
      } else {
        const pendingP = item.payments?.find((p) => p.status === "PENDING");
        if (pendingP) {
          pending += Number(pendingP.amount) || 0;
        }
      }
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

  // Fetch Expenses List
  const fetchExpensesList = useCallback(
    async (
      page = 1,
      showRefreshSpinner = false,
      overrideSearch?: string,
      overrideStatus?: string
    ) => {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setExpenses((prev) => {
          if (!prev || prev.length === 0) setIsLoading(true);
          else setIsRefreshing(true);
          return prev;
        });
      }

      try {
        const activeSearch =
          overrideSearch !== undefined ? overrideSearch : debouncedSearch;
        const activeStatus =
          overrideStatus !== undefined ? overrideStatus : statusFilter;

        const params: Record<string, string | number> = {
          page: isAllTime ? page : 1,
          limit: isAllTime ? pageSize : 500,
        };

        if (activeSearch.trim()) {
          params.search = activeSearch.trim();
        }

        if (activeStatus !== "ALL") {
          params.status = activeStatus;
        }

        const data = await getExpenses(params, showRefreshSpinner);

        if (data) {
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

          // Filter by selected month if not in All Time view
          let displayItems = items;
          if (!isAllTime) {
            displayItems = items.filter((item) => {
              const raw = item.created_at;
              if (!raw) return false;
              const d = new Date(raw);
              if (!isNaN(d.getTime())) {
                return (
                  d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
                );
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
          }

          const totalCount = isAllTime
            ? typeof data.meta?.total === "number"
              ? data.meta.total
              : typeof data.total === "number"
              ? data.total
              : items.length
            : displayItems.length;

          const pagesCount = isAllTime
            ? typeof data.meta?.totalPages === "number"
              ? data.meta.totalPages
              : typeof data.totalPages === "number"
              ? data.totalPages
              : Math.max(1, Math.ceil(totalCount / pageSize))
            : Math.max(1, Math.ceil(displayItems.length / pageSize));

          startTransition(() => {
            setExpenses(displayItems);
            setTotalExpenses(totalCount);
            setCurrentPage(page);
            setTotalPages(pagesCount);
          });

          // Summary stats
          let currentSummary = null;
          if (isAllTime && data.summary) {
            const additionalPendingInstallments = items.reduce((acc, it) => {
              if (it.status === "PENDING") return acc;
              const p = it.payments?.find((pay) => pay.status === "PENDING");
              if (p) return acc + (Number(p.amount) || 0);
              return acc;
            }, 0);

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
            currentSummary = calculateClientSummary(displayItems);
          }

          // Cache first page default list for instant display next time
          if (!activeSearch.trim() && activeStatus === "ALL" && page === 1 && isAllTime) {
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(
                  "bachelorsbook_room_expenses_cache",
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
    [
      debouncedSearch,
      statusFilter,
      toast,
      calculateClientSummary,
      isAllTime,
      selectedYear,
      selectedMonth,
    ]
  );

  // Fetch User Totals (Admin View)
  const fetchUserTotals = useCallback(
    async (force = false) => {
      if (!isAdmin) return;
      setIsLoadingTotals(true);

      try {
        const data = await getUserExpenseTotals(force);
        if (data) {
          let usersList: UserExpenseTotalsItem[] =
            data.users ||
            data.items ||
            (Array.isArray(data) ? data : []);

          if (!isAllTime) {
            usersList = usersList.map((u) => {
              const monthRequests = (u.requests || []).filter((exp: Expense) => {
                const raw = exp.created_at;
                if (!raw) return false;
                const d = new Date(raw);
                if (!isNaN(d.getTime())) {
                  return (
                    d.getFullYear() === selectedYear &&
                    d.getMonth() === selectedMonth
                  );
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

              let approved = 0;
              let pending = 0;
              let remaining = 0;
              let roomRent = 0;

              monthRequests.forEach((exp: Expense) => {
                if (exp.status === "COMPLETE" || exp.status === "REMAINING") {
                  roomRent += Number(exp.total_amount) || 0;
                  remaining += Number(exp.remaining_amount) || 0;
                }
                approved += Number(exp.paid_amount) || 0;
                if (exp.status === "PENDING") {
                  pending += Number(exp.pay_amount) || 0;
                } else {
                  const pendingP = exp.payments?.find((p: any) => p.status === "PENDING");
                  if (pendingP) pending += Number(pendingP.amount) || 0;
                }
              });

              return {
                ...u,
                requests: monthRequests,
                total: approved,
                total_amount: roomRent,
                total_approved: approved,
                total_pending: pending,
                total_remaining: remaining,
              };
            });

            const gApproved = usersList.reduce(
              (sum, u) => sum + (Number(u.total_approved) || 0),
              0
            );
            const gPending = usersList.reduce(
              (sum, u) => sum + (Number(u.total_pending) || 0),
              0
            );
            const gRemaining = usersList.reduce(
              (sum, u) => sum + (Number(u.total_remaining) || 0),
              0
            );
            const gRoom = usersList.reduce(
              (sum, u) => sum + (Number(u.total_amount) || 0),
              0
            );

            setGrandSummary({
              grandTotalRoomRate: gRoom,
              grandTotalApproved: gApproved,
              grandTotalPending: gPending,
              grandTotalRemaining: gRemaining,
              totalUsers: usersList.length,
            });
          } else {
            setGrandSummary(data.grandSummary || null);
          }

          setUserTotals(usersList);
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load user totals dashboard."));
      } finally {
        setIsLoadingTotals(false);
      }
    },
    [isAdmin, toast, isAllTime, selectedYear, selectedMonth]
  );

  // Initial and reactive data fetching
  useEffect(() => {
    if (activeTab === "requests") {
      fetchExpensesList(currentPage);
    } else if (activeTab === "totals" && isAdmin) {
      fetchUserTotals();
    }
  }, [
    currentPage,
    debouncedSearch,
    statusFilter,
    activeTab,
    isAdmin,
    selectedYear,
    selectedMonth,
    isAllTime,
    fetchExpensesList,
    fetchUserTotals,
  ]);

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
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/50 dark:ring-white/10 shrink-0">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {isAdmin
                    ? "Room Rent & Collection Management"
                    : "My Room Rent & Collections"}
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
                  ? "Viewing all room rent collections and balances across all time."
                  : `Live summary & room collections for ${MONTH_NAMES_FULL[selectedMonth]} ${selectedYear}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Month Navigator, Refresh & Create Request */}
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
            onClick={() => {
              if (activeTab === "requests") fetchExpensesList(currentPage, true);
              else fetchUserTotals(true);
            }}
            disabled={isLoading || isRefreshing || isLoadingTotals}
            title="Refresh data"
            className="h-10 w-10 rounded-xl glass-pill shadow-xs hover:border-violet-500/40 cursor-pointer"
          >
            <RotateCw
              className={`h-4 w-4 ${
                isRefreshing || isLoadingTotals
                  ? "animate-spin text-violet-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            />
          </Button>

          {/* Room Rent Request Button */}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="h-10 px-4 rounded-xl gap-2 font-bold shadow-lg shadow-violet-500/25 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span>Room Rent Request</span>
          </Button>
        </div>
      </div>

      {/* Admin Tab Switcher: "All Requests" vs "User Totals Dashboard" */}
      {isAdmin && (
        <div className="inline-flex p-1 rounded-2xl glass-pill border border-white/60 dark:border-white/10 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange("requests")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "requests"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            <span>All Requests</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("totals")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "totals"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25"
                : "text-muted-foreground hover:text-foreground"
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
            titlePrefix={isAllTime ? "Total" : `${MONTH_NAMES[selectedMonth]}`}
          />

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card shadow-lg border border-white/60 dark:border-white/10">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by user, note, or remarks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 bg-white/60 dark:bg-slate-900/60 rounded-xl border-border/60"
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
          onRefresh={() => fetchUserTotals(true)}
          onViewExpense={handleViewDetailsClick}
          onApproveExpense={handleApproveClick}
          onRejectExpense={handleRejectClick}
        />
      )}

      {/* Dialogs */}
      <ExpenseCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onExpenseCreated={() => {
          if (activeTab === "requests") fetchExpensesList(currentPage, true);
          else fetchUserTotals(true);
        }}
        isAdmin={isAdmin}
      />

      {selectedExpense && (
        <>
          <ExpensePayDialog
            open={payDialogOpen}
            onOpenChange={setPayDialogOpen}
            expense={selectedExpense}
            onPaymentSubmitted={() => {
              if (activeTab === "requests") fetchExpensesList(currentPage, true);
              else fetchUserTotals(true);
            }}
          />

          <ExpenseDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            expense={selectedExpense}
          />

          <ExpenseApproveDialog
            open={approveDialogOpen}
            onOpenChange={setApproveDialogOpen}
            expense={selectedExpense}
            onApproved={() => {
              if (activeTab === "requests") fetchExpensesList(currentPage, true);
              else fetchUserTotals(true);
            }}
          />

          <ExpenseRejectDialog
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            expense={selectedExpense}
            onRejected={() => {
              if (activeTab === "requests") fetchExpensesList(currentPage, true);
              else fetchUserTotals(true);
            }}
          />

          <ExpenseEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            expense={selectedExpense}
            onUpdated={() => {
              if (activeTab === "requests") fetchExpensesList(currentPage, true);
              else fetchUserTotals(true);
            }}
          />

          <ExpenseDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            expense={selectedExpense}
            onDeleted={() => {
              if (activeTab === "requests") fetchExpensesList(currentPage, true);
              else fetchUserTotals(true);
            }}
          />
        </>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading room rent collections...
            </p>
          </div>
        </div>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}
