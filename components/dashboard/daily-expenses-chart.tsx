"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import { getDailyExpensesChart } from "@/lib/daily-expense-api";
import {
  DailyExpensesChartResponse,
  DailyTrendItem,
  MonthlyTrendItem,
  CATEGORY_OPTIONS,
} from "@/types/daily-expense";
import { CategoryBadge } from "@/components/daily-expenses/category-badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PieChart as PieChartIcon,
  RefreshCw,
  Layers,
  BarChart2,
} from "lucide-react";

type ViewMode = "monthly" | "yearly";
type BarLayout = "stacked" | "grouped";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const FULL_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CATEGORY_COLORS: Record<string, string> = {
  GROCERY: "#10b981", // Emerald
  VEGETABLES: "#22c55e", // Green
  DAIRY: "#3b82f6", // Blue
  GAS_CYLINDER: "#f97316", // Orange
  WATER: "#0ea5e9", // Sky
  ELECTRIC_BILL: "#f59e0b", // Amber
  "Lawyer/Aunty": "#f43f5e", // Rose
};

// Custom Tooltip for Trend Bar Chart
interface CustomBarTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  viewMode: ViewMode;
  selectedMonth: number;
  selectedYear: number;
}

function CustomBarTooltip({
  active,
  payload,
  label,
  viewMode,
  selectedMonth,
  selectedYear,
}: CustomBarTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload as (DailyTrendItem | MonthlyTrendItem) | undefined;
  if (!dataPoint) return null;

  const total = Number(dataPoint.total) || 0;
  const room = Number(dataPoint.room) || 0;
  const own = Number(dataPoint.own) || 0;
  const count = Number(dataPoint.count) || 0;

  const roomPct = total > 0 ? Math.round((room / total) * 100) : 0;
  const ownPct = total > 0 ? Math.round((own / total) * 100) : 0;

  const title =
    viewMode === "monthly"
      ? `Day ${label} ${MONTH_NAMES[selectedMonth]} ${selectedYear}${
          "dayOfWeek" in dataPoint && dataPoint.dayOfWeek ? ` (${dataPoint.dayOfWeek})` : ""
        }`
      : `${"monthName" in dataPoint ? dataPoint.monthName : label} ${selectedYear}`;

  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-3 min-w-[210px] text-xs space-y-2 pointer-events-none transition-all">
      <div className="border-b border-border/70 pb-1.5 flex items-center justify-between">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {count} {count === 1 ? "expense" : "expenses"}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[11px]">Total Spent:</span>
          <span className="font-mono font-bold text-foreground text-sm">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Room */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Room:
          </span>
          <div className="text-right">
            <span className="font-mono font-semibold text-foreground">
              {formatCurrency(room)}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">
              ({roomPct}%)
            </span>
          </div>
        </div>

        {/* Personal(Own) */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Personal(Own):
          </span>
          <div className="text-right">
            <span className="font-mono font-semibold text-foreground">
              {formatCurrency(own)}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">
              ({ownPct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Tooltip for Circle Category Donut Chart
function CategoryPieTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const { name, value, percentage, count, color } = item.payload;

  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-3 min-w-[170px] text-xs space-y-1.5 pointer-events-none">
      <div className="flex items-center gap-2 border-b border-border/60 pb-1.5 font-semibold text-foreground">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="truncate">{name}</span>
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-muted-foreground text-[11px]">Amount:</span>
        <span className="font-mono font-bold text-foreground">
          {formatCurrency(value)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Share:</span>
        <span className="font-medium text-foreground">{percentage}%</span>
      </div>
      {count > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Transactions:</span>
          <span>{count} tx</span>
        </div>
      )}
    </div>
  );
}

export function DailyExpensesChart() {
  const currentDate = useMemo(() => new Date(), []);
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed (0=Jan)
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [barLayout, setBarLayout] = useState<BarLayout>("stacked");
  const [chartData, setChartData] = useState<DailyExpensesChartResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Mark client mounted and hydrate cached chart from localStorage post-hydration
  useEffect(() => {
    setMounted(true);
    try {
      const item = localStorage.getItem(`khatabook_chart_v2_${selectedYear}_${selectedMonth}`);
      if (item) {
        const cached = JSON.parse(item);
        if (cached) {
          setChartData(cached);
          setIsLoading(false);
        }
      }
    } catch {}
  }, [selectedYear, selectedMonth]);

  // Fetch chart data from backend endpoint: GET /daily-expenses/chart?year={year}&month={month}
  const loadChartData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await getDailyExpensesChart(selectedYear, selectedMonth + 1, showRefreshIndicator);
        setChartData(data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `khatabook_chart_v2_${selectedYear}_${selectedMonth}`,
              JSON.stringify(data)
            );
          } catch {}
        }
      } catch (err) {
        console.error("Failed to load chart analytics:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedYear, selectedMonth]
  );

  useEffect(() => {
    loadChartData();
  }, [selectedYear, selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Summaries
  const metrics = useMemo(() => {
    if (!chartData) {
      return {
        monthTotal: 0,
        monthRoom: 0,
        monthOwn: 0,
        yearTotal: 0,
        yearRoom: 0,
        yearOwn: 0,
      };
    }

    const { dailyTrend, monthlyTrend, summary } = chartData;

    const monthTotal =
      summary?.monthTotal ?? dailyTrend.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
    const monthRoom =
      summary?.monthRoom ?? dailyTrend.reduce((sum, d) => sum + (Number(d.room) || 0), 0);
    const monthOwn =
      summary?.monthOwn ?? dailyTrend.reduce((sum, d) => sum + (Number(d.own) || 0), 0);

    const yearTotal =
      summary?.yearTotal ?? monthlyTrend.reduce((sum, m) => sum + (Number(m.total) || 0), 0);
    const yearRoom =
      summary?.yearRoom ?? monthlyTrend.reduce((sum, m) => sum + (Number(m.room) || 0), 0);
    const yearOwn =
      summary?.yearOwn ?? monthlyTrend.reduce((sum, m) => sum + (Number(m.own) || 0), 0);

    return {
      monthTotal,
      monthRoom,
      monthOwn,
      yearTotal,
      yearRoom,
      yearOwn,
    };
  }, [chartData]);

  // 7 Active Categories Breakdown
  const categoryStats = useMemo(() => {
    const rawBreakdown =
      viewMode === "monthly"
        ? (chartData?.monthCategoryBreakdown || chartData?.categoryBreakdown || [])
        : (chartData?.yearCategoryBreakdown || chartData?.categoryBreakdown || []);

    const activeTotal =
      viewMode === "monthly" ? metrics.monthTotal : metrics.yearTotal;

    const catMap = new Map<string, { total: number; count: number; percentage: number }>();

    // Only populate if active total has expenses (> 0)
    if (activeTotal > 0) {
      rawBreakdown.forEach((item) => {
        let key = item.category;
        if (key === "Vakil/Masi" || key === "VAKIL/MASI") {
          key = "Lawyer/Aunty";
        }
        const existing = catMap.get(key) || { total: 0, count: 0, percentage: 0 };
        catMap.set(key, {
          total: existing.total + (Number(item.total) || 0),
          count: existing.count + (item.count || 0),
          percentage: existing.percentage + (item.percentage || 0),
        });
      });
    }

    return CATEGORY_OPTIONS.map((c) => {
      const found = catMap.get(c.id);
      const total = activeTotal > 0 && found ? found.total : 0;
      const count = activeTotal > 0 && found ? found.count : 0;
      const percentage =
        activeTotal > 0 && total > 0
          ? Math.round((total / activeTotal) * 100)
          : 0;

      return {
        id: c.id,
        label: c.label,
        description: c.description,
        total,
        count,
        percentage,
      };
    }).sort((a, b) => b.total - a.total);
  }, [chartData, viewMode, metrics.monthTotal, metrics.yearTotal]);

  const activePeriodTotal =
    viewMode === "monthly" ? metrics.monthTotal : metrics.yearTotal;

  // Donut Chart Data (Circle-based chart for all categories)
  const pieData = useMemo(() => {
    return categoryStats
      .filter((cat) => cat.total > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.label,
        value: cat.total,
        percentage: cat.percentage,
        count: cat.count,
        color: CATEGORY_COLORS[cat.id] || "#8b5cf6",
      }));
  }, [categoryStats]);

  return (
    <Card className="border border-border/80 bg-card shadow-xs overflow-hidden">
      {/* Header with Switcher Tabs & Controls */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Title & Description */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Daily Expense Analytics</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {viewMode === "monthly" ? "Daily Trend" : "12-Month Trend"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {viewMode === "monthly"
                  ? `Interactive trend and category breakdown for ${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear}`
                  : `Interactive trend and category breakdown for the year ${selectedYear}`}
              </CardDescription>
            </div>
          </div>

          {/* Controls: View Mode, Bar Layout, Month/Year Navigators, Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle (Monthly / Yearly) */}
            <div className="flex items-center bg-background border border-input rounded-lg p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("monthly")}
                className={cn(
                  "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                  viewMode === "monthly"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setViewMode("yearly")}
                className={cn(
                  "px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                  viewMode === "yearly"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
              </button>
            </div>

            {/* Bar Layout Toggle (Stacked vs Grouped) */}
            <div className="hidden sm:flex items-center bg-background border border-input rounded-lg p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setBarLayout("stacked")}
                title="Stacked Bars"
                className={cn(
                  "px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1",
                  barLayout === "stacked"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3 w-3" />
                <span>Stacked</span>
              </button>
              <button
                type="button"
                onClick={() => setBarLayout("grouped")}
                title="Side-by-side Bars"
                className={cn(
                  "px-2.5 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1",
                  barLayout === "grouped"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart2 className="h-3 w-3" />
                <span>Grouped</span>
              </button>
            </div>

            {/* Date Navigators */}
            {viewMode === "monthly" ? (
              <div className="flex items-center bg-background border border-input rounded-lg px-1 h-8 shadow-2xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-semibold px-2 min-w-[95px] text-center text-foreground">
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center bg-background border border-input rounded-lg px-1 h-8 shadow-2xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedYear((y) => y - 1)}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Previous year"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-semibold px-2 min-w-[55px] text-center text-foreground">
                  {selectedYear}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedYear((y) => y + 1)}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Next year"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => loadChartData(true)}
              disabled={isLoading || isRefreshing}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
              title="Refresh chart data"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-6">
        {/* Dual Chart Area: Left = Trend Bar Chart, Right = Category Circle/Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* =================== LEFT: TREND BAR CHART =================== */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between space-y-3 min-w-0">
            {/* Header info & Legend for Bar Chart */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/60 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {viewMode === "monthly"
                    ? `Daily Trend for ${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                    : `Monthly Trend for ${selectedYear}`}
                </span>
              </div>

              {/* Legend with Room and Personal(Own) */}
              <div className="flex items-center gap-3 text-[11px] font-medium shrink-0">
                <div className="flex items-center gap-1.5 text-foreground">
                  <span className="h-2.5 w-2.5 rounded-xs bg-indigo-500 shadow-2xs" />
                  <span>Room</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground">
                  <span className="h-2.5 w-2.5 rounded-xs bg-purple-500 shadow-2xs" />
                  <span>Personal(Own)</span>
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart Area */}
            <div className="w-full pt-1">
              {isLoading && !chartData ? (
                <div className="h-72 w-full flex items-center justify-center bg-muted/10 rounded-xl border border-dashed border-border/60">
                  <div className="space-y-3 text-center">
                    <Skeleton className="h-44 w-full max-w-md mx-auto" />
                    <p className="text-xs text-muted-foreground animate-pulse">
                      Loading analytics chart...
                    </p>
                  </div>
                </div>
              ) : !mounted ? (
                <div className="h-72 w-full flex items-center justify-center bg-muted/10 rounded-xl">
                  <Skeleton className="h-60 w-full" />
                </div>
              ) : viewMode === "monthly" ? (
                /* Monthly View (Day 1 to 31) */
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData?.dailyTrend || []}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-border/60"
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        interval="preserveStartEnd"
                        tickFormatter={(val) => `${val}`}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickFormatter={(val) =>
                          val === 0 ? "₹0" : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                        }
                      />
                      <Tooltip
                        content={
                          <CustomBarTooltip
                            viewMode="monthly"
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                          />
                        }
                        cursor={{ fill: "currentColor", opacity: 0.05 }}
                      />
                      {barLayout === "stacked" ? (
                        <>
                          <Bar
                            dataKey="room"
                            name="Room"
                            stackId="daily"
                            fill="#6366f1"
                            radius={[0, 0, 0, 0]}
                            maxBarSize={28}
                          />
                          <Bar
                            dataKey="own"
                            name="Personal(Own)"
                            stackId="daily"
                            fill="#a855f7"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={28}
                          />
                        </>
                      ) : (
                        <>
                          <Bar
                            dataKey="room"
                            name="Room"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={16}
                          />
                          <Bar
                            dataKey="own"
                            name="Personal(Own)"
                            fill="#a855f7"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={16}
                          />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Yearly View (12 Months) */
                <div className="w-full h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData?.monthlyTrend || []}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-border/60"
                      />
                      <XAxis
                        dataKey="monthName"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickFormatter={(val) =>
                          val === 0 ? "₹0" : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                        }
                      />
                      <Tooltip
                        content={
                          <CustomBarTooltip
                            viewMode="yearly"
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                          />
                        }
                        cursor={{ fill: "currentColor", opacity: 0.05 }}
                      />
                      {barLayout === "stacked" ? (
                        <>
                          <Bar
                            dataKey="room"
                            name="Room"
                            stackId="yearly"
                            fill="#6366f1"
                            radius={[0, 0, 0, 0]}
                            maxBarSize={44}
                          />
                          <Bar
                            dataKey="own"
                            name="Personal(Own)"
                            stackId="yearly"
                            fill="#a855f7"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={44}
                          />
                        </>
                      ) : (
                        <>
                          <Bar
                            dataKey="room"
                            name="Room"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={22}
                          />
                          <Bar
                            dataKey="own"
                            name="Personal(Own)"
                            fill="#a855f7"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={22}
                          />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* =================== RIGHT: CIRCLE-BASED CATEGORY CHART =================== */}
          <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-border/70 bg-muted/15 p-4 flex flex-col justify-between space-y-3 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-1.5">
                <PieChartIcon className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Category Share
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                Total: {formatCurrency(activePeriodTotal)}
              </span>
            </div>

            {/* Donut Chart with Centered Total */}
            <div className="relative w-full h-56 flex items-center justify-center">
              {!mounted || isLoading ? (
                <Skeleton className="h-44 w-44 rounded-full" />
              ) : pieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="h-32 w-32 rounded-full border-4 border-dashed border-border/70 flex items-center justify-center">
                    <span className="text-[11px] text-muted-foreground">No Spend</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    No expenses recorded in this period
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CategoryPieTooltip />} />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        cornerRadius={4}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={entry.color}
                            stroke="transparent"
                            className="transition-all duration-200 hover:opacity-85 cursor-pointer"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Total inside Donut Hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Total
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-foreground">
                      {formatCurrency(activePeriodTotal)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {pieData.length} {pieData.length === 1 ? "cat" : "cats"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Mini Category Chips / Legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/50 text-[11px]">
              {categoryStats.slice(0, 6).map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/30 border border-border/40 min-w-0"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.id] || "#8b5cf6" }}
                    />
                    <span className="truncate text-foreground text-[10px] font-medium">
                      {cat.label}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-1">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =================== BOTTOM: 7 CATEGORY BREAKDOWN CARDS =================== */}
        <div className="pt-4 border-t border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <PieChartIcon className="h-3.5 w-3.5 text-primary" />
              <span>
                Category Breakdown (
                {viewMode === "monthly"
                  ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                  : `Year ${selectedYear}`}
                )
              </span>
            </h4>
            <span className="text-xs font-bold font-mono text-foreground">
              Total: {formatCurrency(activePeriodTotal)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {categoryStats.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl border border-border/70 bg-muted/20 hover:border-border transition-all flex flex-col justify-between space-y-2 min-w-0"
              >
                <div className="min-w-0">
                  <CategoryBadge category={cat.id} size="sm" className="max-w-full" />
                  <p className="text-[10px] text-muted-foreground truncate mt-1">
                    {cat.description}
                  </p>
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className="font-mono font-bold text-xs text-foreground truncate">
                    {formatCurrency(cat.total)}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>{cat.percentage}%</span>
                    <span>{cat.count > 0 ? `${cat.count} tx` : "0 tx"}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-muted/70 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      cat.percentage > 0 ? "bg-primary" : "bg-transparent"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
