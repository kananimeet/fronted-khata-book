"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReceiptText,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  RotateCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Printer,
  Download,
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/format";
import { formatDate, cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image";
import { getStatement } from "@/lib/statement-api";
import { exportStatementToPdf } from "@/lib/statement-pdf";
import { getUsersForExpenseSelect } from "@/lib/expense-api";
import {
  StatementEntry,
  StatementSummary,
  StatementPagination,
  StatementQueryParams,
} from "@/types/statement";
import { User } from "@/types/auth";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function StatementPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed
  const [isAllTime, setIsAllTime] = useState<boolean>(false);

  // Filter States
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // Data States
  const [items, setItems] = useState<StatementEntry[]>([]);
  const [summary, setSummary] = useState<StatementSummary>({
    openingBalance: 0,
    closingBalance: 0,
    totalCredit: 0,
    totalDebit: 0,
    netChange: 0,
    totalTransactions: 0,
    currentPoolBalance: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [pagination, setPagination] = useState<StatementPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Receipt Modal State
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptTitle, setReceiptTitle] = useState<string>("");

  // 300ms Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Users List for Dropdown
  useEffect(() => {
    getUsersForExpenseSelect()
      .then((u) => setUsers(u))
      .catch(() => {});
  }, []);

  // Fetch Statement Data with Server-Side Pagination
  const fetchStatementData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setItems((prev) => {
          if (!prev || prev.length === 0) setIsLoading(true);
          else setIsRefreshing(true);
          return prev;
        });
      }

      try {
        const params: StatementQueryParams = {
          page: currentPage,
          limit: pageSize,
          type: typeFilter,
          user_id: userFilter !== "all" ? userFilter : undefined,
          search: debouncedSearch.trim() || undefined,
          sortOrder: sortOrder,
        };

        if (!isAllTime) {
          if (startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
          } else {
            params.year = selectedYear;
            params.month = selectedMonth + 1;
          }
        }

        const res = await getStatement(params, isManualRefresh);
        if (res) {
          setItems(res.items || []);
          if (res.summary) setSummary(res.summary);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } catch (err) {
        console.error("Failed to load statement records:", err);
        toast.error("Failed to load account statement records.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      currentPage,
      pageSize,
      typeFilter,
      userFilter,
      debouncedSearch,
      sortOrder,
      isAllTime,
      startDate,
      endDate,
      selectedYear,
      selectedMonth,
      toast,
    ]
  );

  useEffect(() => {
    fetchStatementData();
  }, [fetchStatementData]);

  // Handle Full Statement Export to PDF with Official Logo
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      toast.info("Preparing full account statement PDF...");

      const exportParams: StatementQueryParams = {
        all: true,
        type: typeFilter,
        user_id: userFilter !== "all" ? userFilter : undefined,
        search: debouncedSearch.trim() || undefined,
        sortOrder: sortOrder,
      };

      if (!isAllTime) {
        if (startDate && endDate) {
          exportParams.startDate = startDate;
          exportParams.endDate = endDate;
        } else {
          exportParams.year = selectedYear;
          exportParams.month = selectedMonth + 1;
        }
      }

      const res = await getStatement(exportParams, true);
      const allItems = res.items || [];
      const currentSummary = res.summary || summary;

      const periodLabel = isAllTime
        ? "All Time"
        : startDate && endDate
        ? `${startDate} to ${endDate}`
        : `${MONTH_NAMES_FULL[selectedMonth]} ${selectedYear}`;

      const selectedUserName =
        userFilter !== "all"
          ? users.find((u) => u.id === userFilter)?.name
          : undefined;

      exportStatementToPdf({
        items: allItems,
        summary: currentSummary,
        periodLabel,
        generatedBy: currentUser?.name || "Super Admin",
        activeFilters: {
          type: typeFilter,
          roommate: selectedUserName,
          search: debouncedSearch || undefined,
          dateRange: startDate && endDate ? `${startDate} to ${endDate}` : undefined,
        },
      });

      toast.success("Statement PDF preview opened. Click 'Save as PDF' to download.");
    } catch (err) {
      console.error("Failed to export statement PDF:", err);
      toast.error("Failed to generate PDF statement.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setIsAllTime(false);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    setIsAllTime(false);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleToggleAllTime = () => {
    setIsAllTime((prev) => !prev);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTypeFilter("ALL");
    setSearchInput("");
    setDebouncedSearch("");
    setUserFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const isCurrentMonthSelected =
    !isAllTime &&
    !startDate &&
    !endDate &&
    selectedYear === currentDate.getFullYear() &&
    selectedMonth === currentDate.getMonth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:space-y-4">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-white/50 dark:ring-white/10 shrink-0">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Account Statement
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                Live Passbook
              </Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <Calendar className="h-3 w-3" />
                {isAllTime
                  ? "All Time"
                  : startDate && endDate
                  ? `${startDate} to ${endDate}`
                  : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Complete credit, debit, and running available room balance ledger.
            </p>
          </div>
        </div>

        {/* Top Controls: Month Selector, Print, Refresh */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Month Selector Bar */}
          <div className="flex items-center p-1 rounded-xl glass-pill border border-white/60 dark:border-white/10 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              disabled={isAllTime}
              title="Previous month"
              aria-label="Previous month"
              className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-3 text-xs font-bold tracking-tight min-w-[85px] text-center select-none">
              {isAllTime
                ? "All Time"
                : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={isAllTime}
              title="Next month"
              aria-label="Next month"
              className="h-8 w-8 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer disabled:opacity-40"
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
            variant={isAllTime ? "default" : "outline"}
            size="sm"
            onClick={handleToggleAllTime}
            className={cn(
              "h-10 px-3.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer",
              isAllTime
                ? "bg-violet-600 text-white shadow-violet-500/25"
                : "glass-pill hover:border-violet-500/40"
            )}
          >
            All Time
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || isLoading}
            className="h-10 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20 cursor-pointer flex items-center gap-2 transition-all"
            title="Download full statement as styled PDF with website logo"
          >
            {isExportingPdf ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handlePrint}
            title="Print Current Statement"
            aria-label="Print Current Statement"
            className="h-10 w-10 rounded-xl glass-pill shadow-xs hover:border-violet-500/40 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchStatementData(true)}
            disabled={isLoading || isRefreshing}
            title="Refresh statement"
            aria-label="Refresh statement"
            className="h-10 w-10 rounded-xl glass-pill shadow-xs hover:border-violet-500/40 cursor-pointer"
          >
            <RotateCw
              className={cn(
                "h-4 w-4",
                isRefreshing
                  ? "animate-spin text-violet-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Printable Header for physical/PDF export with Website Logo */}
      <div className="hidden print:flex items-center justify-between pb-4 border-b-2 border-slate-300 mb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/logo.png"
            alt="Bachelors Book Logo"
            className="h-14 w-14 rounded-2xl object-contain shadow-xs"
          />
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              Bachelors<span className="text-emerald-600">-Book</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Track • Manage • Share | Official Account Statement & Passbook
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-600 leading-tight">
          <div className="text-sm font-extrabold text-slate-900 mb-0.5">
            Period: {isAllTime ? "All Time" : `${MONTH_NAMES_FULL[selectedMonth]} ${selectedYear}`}
          </div>
          <div>Generated on: {formatDate(new Date().toISOString(), true)} (IST)</div>
          <div>Generated by: {currentUser?.name || "Super Admin"}</div>
          <div className="text-[10px] font-bold text-emerald-600 mt-1">Verified Digital Ledger</div>
        </div>
      </div>

      {/* 2. Top 4 Passbook Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Closing / Available Balance */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-white/75 dark:bg-slate-900/55 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              Available Room Balance
            </span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={cn(
                "text-2xl font-extrabold tracking-tight font-mono",
                summary.closingBalance >= 0
                  ? "text-foreground"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {formatINR(summary.closingBalance)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-medium truncate">
              {summary.openingBalance > 0
                ? `Opening: ${formatINR(summary.openingBalance)} carried fwd`
                : "Live pool closing balance"}
            </p>
          </div>
        </div>

        {/* Card 2: Total Credits (+) */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-white/75 dark:bg-slate-900/55 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              Total Credits (+)
            </span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
              +{formatINR(summary.totalCredit)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-medium truncate">
              Room rent & funds deposited
            </p>
          </div>
        </div>

        {/* Card 3: Total Debits (-) */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-white/75 dark:bg-slate-900/55 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              Total Debits (-)
            </span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight font-mono text-rose-600 dark:text-rose-400">
              -{formatINR(summary.totalDebit)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-medium truncate">
              Daily grocery expenses paid
            </p>
          </div>
        </div>

        {/* Card 4: Net Flow */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-white/75 dark:bg-slate-900/55 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              Net Period Cashflow
            </span>
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                summary.netChange >= 0
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}
            >
              {summary.netChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={cn(
                "text-2xl font-extrabold tracking-tight font-mono",
                summary.netChange >= 0
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {summary.netChange >= 0 ? "+" : ""}
              {formatINR(summary.netChange)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-medium truncate">
              {summary.totalTransactions} transactions recorded
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Controls Toolbar */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Credit / Debit Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0">
            <button
              onClick={() => {
                setTypeFilter("ALL");
                setCurrentPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                typeFilter === "ALL"
                  ? "bg-white dark:bg-slate-800 text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All ({summary.totalTransactions})
            </button>
            <button
              onClick={() => {
                setTypeFilter("CREDIT");
                setCurrentPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                typeFilter === "CREDIT"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Credits (+)
            </button>
            <button
              onClick={() => {
                setTypeFilter("DEBIT");
                setCurrentPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                typeFilter === "DEBIT"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Debits (-)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search notes, category, member..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white/80 dark:bg-slate-900/60 border-border/60 text-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters: User selector, Custom Date Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40 text-xs">
          {/* Roommate Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" /> Roommate:
            </span>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-border/60 text-xs font-medium cursor-pointer"
            >
              <option value="all">All Roommates</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold">From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setIsAllTime(false);
                setCurrentPage(1);
              }}
              className="h-8 w-36 text-xs px-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border-border/60"
            />
            <span className="text-muted-foreground font-semibold">To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setIsAllTime(false);
                setCurrentPage(1);
              }}
              className="h-8 w-36 text-xs px-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border-border/60"
            />
          </div>

          {/* Clear Filters Button */}
          {(typeFilter !== "ALL" ||
            searchInput ||
            userFilter !== "all" ||
            startDate ||
            endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1 rounded-lg ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* 4. Passbook Statement Table */}
      <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg shadow-slate-200/30 dark:shadow-none overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 w-36 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
              <ReceiptText className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Transactions Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              No statement entries match your active period or filters. Try switching months or clearing filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th
                    className="py-3.5 px-4 cursor-pointer select-none"
                    onClick={() => {
                      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
                      setCurrentPage(1);
                    }}
                    title={`Currently sorted ${sortOrder} (Click to toggle)`}
                  >
                    <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                      <span>Date & Time (IST)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold uppercase">
                        {sortOrder}
                      </span>
                      {sortOrder === "ASC" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-4">Particulars / Note</th>
                  <th className="py-3.5 px-4">Roommate</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Available Room Balance</th>
                  <th className="py-3.5 px-3 text-center print:hidden">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {items.map((tx) => {
                  const isCredit = tx.type === "CREDIT";
                  const receiptUrl = tx.payment_photo
                    ? getImageUrl(tx.payment_photo)
                    : null;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* 1. Date & Time (IST) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <div className="font-semibold text-foreground">
                          {formatDate(tx.date)}
                        </div>
                      </td>

                      {/* 2. Type Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isCredit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <ArrowDownLeft className="h-3 w-3" />
                            Credit (+)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <ArrowUpRight className="h-3 w-3" />
                            Debit (-)
                          </span>
                        )}
                      </td>

                      {/* 3. Particulars / Note */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="font-semibold text-foreground truncate" title={tx.note}>
                          {tx.note}
                        </div>
                        <span className="inline-block text-[10px] font-medium text-muted-foreground/90 uppercase tracking-wider">
                          {tx.category}
                        </span>
                      </td>

                      {/* 4. Roommate */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border border-border shrink-0">
                            {tx.user?.profile_picture && (
                              <AvatarImage
                                src={getImageUrl(tx.user.profile_picture)}
                                alt={tx.user.name}
                              />
                            )}
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {tx.user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <p className="text-xs font-semibold text-foreground">
                              {tx.user.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 5. Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                        {isCredit ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatINR(tx.amount)}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">
                            -{formatINR(tx.amount)}
                          </span>
                        )}
                      </td>

                      {/* 6. Running Available Balance */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-extrabold text-sm">
                        <span
                          className={cn(
                            tx.balance >= 0
                              ? "text-foreground"
                              : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {formatINR(tx.balance)}
                        </span>
                      </td>

                      {/* 7. Receipt Action */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap print:hidden">
                        {receiptUrl ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setReceiptImage(receiptUrl);
                              setReceiptTitle(`${tx.note} (${formatINR(tx.amount)})`);
                            }}
                            className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-500/10 cursor-pointer"
                            title="View receipt image"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/40 text-xs font-medium gap-3 print:hidden">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>
                Showing{" "}
                <span className="font-bold text-foreground">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground font-mono">
                  {pagination.total}
                </span>{" "}
                records
              </span>

              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5 pl-3 border-l border-border/60">
                <span className="hidden sm:inline">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  className="h-7 px-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-border/60 text-xs font-bold cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isLoading}
                className="h-8 px-2.5 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="px-2 font-bold font-mono">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="h-8 px-2.5 rounded-lg cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Image Modal */}
      <Dialog open={!!receiptImage} onOpenChange={(open) => !open && setReceiptImage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-violet-500" />
              {receiptTitle || "Transaction Receipt"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/40 overflow-hidden max-h-[70vh]">
            {receiptImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={receiptImage}
                alt="Receipt"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
              />
            )}
          </div>
          {receiptImage && (
            <div className="flex justify-end pt-2">
              <a
                href={receiptImage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open original image
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

