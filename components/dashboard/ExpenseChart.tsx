"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
  BarChart2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DailyExpensesChartResponse } from "@/types/daily-expense";

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

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomGlassTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const roomItem = payload.find((p) => p.dataKey === "room");
  const personalItem = payload.find((p) => p.dataKey === "personal");
  const roomVal = Number(roomItem?.value) || 0;
  const personalVal = Number(personalItem?.value) || 0;
  const totalVal = roomVal + personalVal;

  return (
    <div className="glass-card rounded-xl p-3.5 shadow-2xl border border-white/40 dark:border-white/10 text-xs min-w-[200px] z-50">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-violet-500" />
          {label}
        </span>
        <span className="font-mono font-bold text-foreground">
          {formatINR(totalVal)}
        </span>
      </div>

      <div className="space-y-1.5 font-medium">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-xs" />
            Room Share:
          </span>
          <span className="font-mono text-foreground font-semibold">
            {formatINR(roomVal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-fuchsia-500 shadow-xs" />
            Personal (Own):
          </span>
          <span className="font-mono text-foreground font-semibold">
            {formatINR(personalVal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export interface ExpenseChartProps {
  chartData: DailyExpensesChartResponse | null;
  viewMode: "monthly" | "yearly";
  onViewModeChange: (mode: "monthly" | "yearly") => void;
  barLayout: "stacked" | "grouped";
  onBarLayoutChange: (layout: "stacked" | "grouped") => void;
  selectedYear: number;
  selectedMonth: number; // 0-indexed (0=Jan)
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function ExpenseChart({
  chartData,
  viewMode,
  onViewModeChange,
  barLayout,
  onBarLayoutChange,
  selectedYear,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  onReset,
  isLoading = false,
}: ExpenseChartProps) {
  // Format dynamic data from backend API
  const chartItems = React.useMemo(() => {
    if (!chartData) return [];

    if (viewMode === "monthly") {
      const dailyTrend = chartData.dailyTrend || [];
      return dailyTrend.map((d) => ({
        day: `${String(d.day).padStart(2, "0")} ${MONTH_NAMES[selectedMonth]}`,
        dateNumber: d.day,
        room: Number(d.room) || 0,
        personal: Number(d.own) || 0,
        total: Number(d.total) || 0,
      }));
    } else {
      const monthlyTrend = chartData.monthlyTrend || [];
      return monthlyTrend.map((m) => {
        const mIdx = (Number(m.month) || 1) - 1;
        return {
          day: m.monthName || MONTH_NAMES[mIdx] || `M${m.month}`,
          dateNumber: m.month,
          room: Number(m.room) || 0,
          personal: Number(m.own) || 0,
          total: Number(m.total) || 0,
        };
      });
    }
  }, [chartData, viewMode, selectedMonth]);

  // Dynamic totals
  const totalRoom = React.useMemo(() => {
    return chartItems.reduce((acc, curr) => acc + curr.room, 0);
  }, [chartItems]);

  const totalPersonal = React.useMemo(() => {
    return chartItems.reduce((acc, curr) => acc + curr.personal, 0);
  }, [chartItems]);

  const hasData = chartItems.some((item) => item.total > 0);

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Header & Controls Bar */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <Sparkles className="h-3 w-3" />
                {viewMode === "monthly" ? "Daily Trend" : "12-Month Trend"}
              </span>
              <h3 className="text-base font-bold text-foreground tracking-tight">
                Daily Expense Analytics
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {viewMode === "monthly"
                ? `Daily live expenses for ${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear}`
                : `Annual expenses breakdown across ${selectedYear}`}
            </p>
          </div>

          {/* Segmented Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode: Monthly / Yearly */}
            <div className="inline-flex p-0.5 rounded-xl bg-muted/60 border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => onViewModeChange("monthly")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  viewMode === "monthly"
                    ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("yearly")}
                className={cn(
                  "px-3 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  viewMode === "yearly"
                    ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
              </button>
            </div>

            {/* Layout Toggle: Stacked / Grouped */}
            <div className="inline-flex p-0.5 rounded-xl bg-muted/60 border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => onBarLayoutChange("stacked")}
                title="Stacked bars"
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  barLayout === "stacked"
                    ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Stacked</span>
              </button>
              <button
                type="button"
                onClick={() => onBarLayoutChange("grouped")}
                title="Grouped bars"
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
                  barLayout === "grouped"
                    ? "bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grouped</span>
              </button>
            </div>

            {/* Month / Year Navigator */}
            <div className="flex items-center rounded-xl bg-muted/60 border border-border/60 px-1 py-0.5 text-xs">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={onPrevMonth}
                aria-label={viewMode === "monthly" ? "Previous month" : "Previous year"}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-semibold text-foreground select-none min-w-[75px] text-center">
                {viewMode === "monthly"
                  ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                  : `${selectedYear}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={onNextMonth}
                aria-label={viewMode === "monthly" ? "Next month" : "Next year"}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-xl border-border/60 text-muted-foreground hover:text-foreground"
              onClick={onReset}
              title="Reset to current month"
              aria-label="Reset to current month"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Dynamic Totals Summary Pill */}
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-xs" />
            <span>Room:</span>
            <span className="font-mono font-bold text-foreground">
              {formatINR(totalRoom)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 shadow-xs" />
            <span>Personal:</span>
            <span className="font-mono font-bold text-foreground">
              {formatINR(totalPersonal)}
            </span>
          </div>
        </div>
      </div>

      {/* Main BarChart Canvas */}
      <div className="w-full h-[280px] sm:h-[310px] mt-4 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-xs rounded-xl z-10">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1.5">
            <Calendar className="h-8 w-8 stroke-1 text-muted-foreground/40 mb-1" />
            <p className="font-semibold text-foreground/80">No expenses recorded</p>
            <p className="text-[11px] text-muted-foreground">
              No daily expenses found for {viewMode === "monthly" ? `${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear}` : `${selectedYear}`}.
            </p>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartItems}
            margin={{ top: 12, right: 12, left: -14, bottom: 0 }}
            barGap={4}
          >
            <defs>
              {/* Room Series Gradient (Indigo) */}
              <linearGradient id="roomBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                <stop offset="100%" stopColor="#4338ca" stopOpacity="0.85" />
              </linearGradient>

              {/* Personal Series Gradient (Fuchsia) */}
              <linearGradient id="personalBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e879f9" stopOpacity="1" />
                <stop offset="100%" stopColor="#c026d3" stopOpacity="0.85" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border/50"
            />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground font-mono"
              tickFormatter={(v) =>
                v === 0 ? "₹0" : `₹${Math.round(v / 1000)}k`
              }
            />

            <Tooltip
              content={<CustomGlassTooltip />}
              cursor={{ fill: "rgba(139, 92, 246, 0.06)", radius: 8 }}
            />

            <Bar
              dataKey="room"
              name="Room"
              fill="url(#roomBarGrad)"
              stackId={barLayout === "stacked" ? "expenses" : undefined}
              radius={
                barLayout === "stacked"
                  ? [0, 0, 0, 0]
                  : [6, 6, 0, 0]
              }
            />

            <Bar
              dataKey="personal"
              name="Personal (Own)"
              fill="url(#personalBarGrad)"
              stackId={barLayout === "stacked" ? "expenses" : undefined}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
