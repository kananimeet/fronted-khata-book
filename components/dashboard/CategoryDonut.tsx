"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CategoryBreakdownItem } from "@/types/daily-expense";

const CATEGORY_STYLE_MAP: Record<string, { label: string; color: string }> = {
  GROCERY: { label: "Groceries", color: "#8b5cf6" },
  VEGETABLES: { label: "Vegetables", color: "#10b981" },
  DAIRY: { label: "Milk & Dairy", color: "#06b6d4" },
  GAS_CYLINDER: { label: "Gas Cylinder", color: "#f97316" },
  WATER: { label: "Water Supply", color: "#38bdf8" },
  ELECTRIC_BILL: { label: "Electricity Bill", color: "#f59e0b" },
  ELECTRICITY_BILL: { label: "Electricity Bill", color: "#f59e0b" },
  "Lawyer/Aunty": { label: "Aunty / Cleaning", color: "#ec4899" },
  "Vakil/Masi": { label: "Aunty / Cleaning", color: "#ec4899" },
  OTHER: { label: "Other", color: "#6366f1" },
};

export interface CategoryDonutProps {
  categories: CategoryBreakdownItem[];
  totalAmount: number;
  periodLabel?: string;
  isLoading?: boolean;
}

export function CategoryDonut({
  categories = [],
  totalAmount = 0,
  periodLabel = "This Month",
  isLoading = false,
}: CategoryDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Map dynamic backend categories with colors & formatted percentages
  const formattedCategories = useMemo(() => {
    if (!categories || categories.length === 0 || totalAmount <= 0) return [];

    return categories
      .filter((c) => (Number(c.total) || 0) > 0)
      .map((c) => {
        let key = String(c.category || "OTHER");
        if (key === "Vakil/Masi" || key === "VAKIL/MASI") {
          key = "Lawyer/Aunty";
        }
        const style = CATEGORY_STYLE_MAP[key] || {
          label: key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " "),
          color: "#8b5cf6",
        };
        const val = Number(c.total) || 0;
        const pct =
          c.percentage !== undefined
            ? Math.round(Number(c.percentage))
            : totalAmount > 0
            ? Math.round((val / totalAmount) * 100)
            : 0;

        return {
          id: key,
          name: style.label,
          value: val,
          color: style.color,
          percentage: pct,
          count: c.count || 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [categories, totalAmount]);

  const activeCategory =
    activeIndex !== null && formattedCategories[activeIndex]
      ? formattedCategories[activeIndex]
      : null;

  const hasData = formattedCategories.length > 0 && totalAmount > 0;

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
            <PieChartIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              Category Share
            </h3>
            <p className="text-xs text-muted-foreground">
              {periodLabel} distribution
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground">
          {formattedCategories.length} categories
        </span>
      </div>

      {/* Donut Chart with Centered Live Total */}
      <div className="relative w-full h-[220px] flex items-center justify-center my-1">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="h-16 w-16 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center mb-2">
              <PieChartIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-xs font-semibold text-foreground/80">No Category Breakdown</p>
            <p className="text-[11px] text-muted-foreground max-w-[180px] mt-0.5">
              Expenses recorded will automatically display their dynamic percentage split here.
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="glass-card rounded-xl p-2.5 shadow-xl border border-white/40 dark:border-white/10 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          <span>{data.name}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-4 font-mono font-bold text-foreground">
                          <span>{formatINR(data.value)}</span>
                          <span className="text-muted-foreground font-sans text-[11px]">
                            ({data.percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={formattedCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {formattedCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="transparent"
                      className={cn(
                        "transition-all duration-300 cursor-pointer outline-none",
                        activeIndex === index
                          ? "opacity-100 scale-105"
                          : activeIndex !== null
                          ? "opacity-50"
                          : "opacity-100"
                      )}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Total Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {activeCategory ? activeCategory.name : "Total Spent"}
              </span>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground font-mono mt-0.5">
                {formatINR(activeCategory ? activeCategory.value : totalAmount)}
              </span>
              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                {activeCategory
                  ? `${activeCategory.percentage}% of total`
                  : "100% breakdown"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Category Legend with Percentages */}
      {hasData ? (
        <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-border/50 max-h-[120px] overflow-y-auto">
          {formattedCategories.map((cat, idx) => (
            <div
              key={cat.id}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                activeIndex === idx
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate">{cat.name}</span>
              </div>
              <span className="font-mono text-[11px] font-semibold text-foreground shrink-0 ml-1">
                {cat.percentage}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="pt-2 text-center text-[11px] text-muted-foreground border-t border-border/50">
          Waiting for live transactions...
        </div>
      )}
    </div>
  );
}
