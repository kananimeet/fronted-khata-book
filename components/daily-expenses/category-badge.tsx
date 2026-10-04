"use client";

import React from "react";
import {
  ShoppingBag,
  Apple,
  Coffee,
  Flame,
  Droplets,
  Users,
  Zap,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_OPTIONS, DailyExpenseCategory } from "@/types/daily-expense";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Apple,
  Coffee,
  Flame,
  Droplets,
  Zap,
  Users,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  GROCERY: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  VEGETABLES: {
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-500/20",
  },
  DAIRY: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/20",
  },
  GAS_CYLINDER: {
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/20",
  },
  WATER: {
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/20",
  },
  ELECTRIC_BILL: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20",
  },
  ELECTRICITY_BILL: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20",
  },
  "LAWYER/AUNTY": {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20",
  },
  "Lawyer/Aunty": {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20",
  },
  "VAKIL/MASI": {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20",
  },
  "Vakil/Masi": {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20",
  },
  OTHER: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

interface CategoryBadgeProps {
  category: DailyExpenseCategory | string;
  size?: "sm" | "md";
  className?: string;
}

export function CategoryBadge({
  category,
  size = "md",
  className,
}: CategoryBadgeProps) {
  const normalizedKey = (category || "").toUpperCase();
  const option = CATEGORY_OPTIONS.find(
    (opt) =>
      opt.id.toUpperCase() === normalizedKey ||
      (normalizedKey.includes("VAKIL") && opt.id === "Lawyer/Aunty") ||
      (normalizedKey.includes("LAWYER") && opt.id === "Lawyer/Aunty")
  );

  const colors = COLOR_MAP[normalizedKey] || COLOR_MAP.OTHER;
  const IconComponent = option ? ICON_MAP[option.iconName] || Tag : Tag;
  const label = option ? option.label : category || "General";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors",
        colors.bg,
        colors.text,
        colors.border,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <IconComponent className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span className="truncate max-w-[150px]">{label}</span>
    </span>
  );
}
