"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PieChart as PieChartIcon, X } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selectedCategoryItem = useMemo(() => {
    if (!selectedId) return null;
    return formattedCategories.find((c) => c.id === selectedId) || null;
  }, [selectedId, formattedCategories]);

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

      {/* Donut Chart with Centered Overall Total (Always Stable) */}
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
                <Pie
                  data={formattedCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={(_, index) => {
                    const item = formattedCategories[index];
                    if (item) {
                      setSelectedId((prev) => (prev === item.id ? null : item.id));
                    }
                  }}
                >
                  {formattedCategories.map((entry) => {
                    const isSelected = selectedId === entry.id;
                    const hasSelection = selectedId !== null;

                    return (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.color}
                        stroke="transparent"
                        className={cn(
                          "transition-all duration-300 cursor-pointer outline-none",
                          isSelected
                            ? "opacity-100 scale-105"
                            : hasSelection
                            ? "opacity-35"
                            : "opacity-100 hover:opacity-85"
                        )}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Total Overlay - ALWAYS shows Total Spent cleanly */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Spent
              </span>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground font-mono mt-0.5">
                {formatINR(totalAmount)}
              </span>
              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                100% breakdown
              </span>
            </div>
          </>
        )}
      </div>

      {/* Selected Category Highlight Card (appears ONLY below when a category is clicked) */}
      {hasData && selectedCategoryItem && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/30 text-xs mb-2 transition-all animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white/50 dark:ring-white/10"
              style={{ backgroundColor: selectedCategoryItem.color }}
            />
            <div className="min-w-0">
              <p className="font-extrabold text-foreground truncate text-xs flex items-center gap-1.5">
                <span>{selectedCategoryItem.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400">
                  {selectedCategoryItem.percentage}%
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                {selectedCategoryItem.count > 0 ? `${selectedCategoryItem.count} expenses recorded` : "Category Total"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-extrabold text-sm text-foreground">
              {formatINR(selectedCategoryItem.value)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(null);
              }}
              className="h-5 w-5 rounded-md flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Clear category selection"
              aria-label="Clear category selection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Category Legend with Percentages (Clickable to inspect below) */}
      {hasData ? (
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/50 max-h-[120px] overflow-y-auto">
          {formattedCategories.map((cat) => {
            const isSelected = selectedId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedId((prev) => (prev === cat.id ? null : cat.id))}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border",
                  isSelected
                    ? "bg-violet-500/15 border-violet-500/40 text-foreground font-bold shadow-xs scale-[1.02]"
                    : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                title={`Click to view ${cat.name} details below`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-foreground shrink-0 ml-1">
                  {cat.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pt-2 text-center text-[11px] text-muted-foreground border-t border-border/50">
          Waiting for live transactions...
        </div>
      )}
    </div>
  );
}
