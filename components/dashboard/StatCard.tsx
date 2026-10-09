"use client";

import React, { useEffect, useState } from "react";
import { LucideIcon, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  variant: "blue" | "violet" | "emerald" | "amber" | "rose";
  sparklineData?: number[];
  delay?: number;
}

const VARIANT_CONFIGS = {
  blue: {
    topBorder: "from-cyan-500 via-blue-500 to-indigo-500",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 ring-cyan-500/30",
    glow: "group-hover:shadow-cyan-500/10",
    sparkStroke: "#06b6d4",
    sparkFill: "rgba(6, 182, 212, 0.15)",
    badgeBorder: "border-cyan-500/20",
    badgeGlow: "shadow-cyan-500/20",
  },
  violet: {
    topBorder: "from-violet-500 via-purple-500 to-fuchsia-500",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 ring-violet-500/30",
    glow: "group-hover:shadow-violet-500/10",
    sparkStroke: "#8b5cf6",
    sparkFill: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "border-violet-500/20",
    badgeGlow: "shadow-violet-500/20",
  },
  emerald: {
    topBorder: "from-emerald-400 via-green-500 to-teal-500",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/10",
    sparkStroke: "#10b981",
    sparkFill: "rgba(16, 185, 129, 0.15)",
    badgeBorder: "border-emerald-500/20",
    badgeGlow: "shadow-emerald-500/20",
  },
  amber: {
    topBorder: "from-amber-400 via-orange-500 to-amber-600",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-amber-500/30",
    glow: "group-hover:shadow-amber-500/10",
    sparkStroke: "#f59e0b",
    sparkFill: "rgba(245, 158, 11, 0.15)",
    badgeBorder: "border-amber-500/20",
    badgeGlow: "shadow-amber-500/20",
  },
  rose: {
    topBorder: "from-rose-500 via-pink-500 to-red-500",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-rose-500/30",
    glow: "group-hover:shadow-rose-500/10",
    sparkStroke: "#f43f5e",
    sparkFill: "rgba(244, 63, 94, 0.15)",
    badgeBorder: "border-rose-500/20",
    badgeGlow: "shadow-rose-500/20",
  },
};

// SVG Sparkline component with animated line path
function Sparkline({
  data,
  stroke,
  fill,
  id,
}: {
  data: number[];
  stroke: string;
  fill: string;
  id: string;
}) {
  if (!data || data.length < 2) return null;
  const width = 100;
  const height = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    return `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-24 h-8 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${id})`} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant,
  sparklineData = [20, 25, 18, 30, 28, 35, 42],
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const config = VARIANT_CONFIGS[variant];

  // Animated Count-Up on mount / value change
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1100;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quartic
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(ease * value));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delay * 0.08, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5",
        "bg-white/75 dark:bg-slate-900/55 backdrop-blur-xl",
        "border border-white/60 dark:border-white/10",
        "shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-xl",
        config.glow,
        "transition-all duration-300"
      )}
    >
      {/* Top Gradient Border Line */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 h-1 bg-gradient-to-r",
          config.topBorder
        )}
      />

      {/* Subtle interior ambient glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl opacity-20 dark:opacity-30",
          config.topBorder
        )}
      />

      {/* Header: Title + Icon Badge */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
          {title}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 shadow-xs transition-transform group-hover:scale-110 duration-200",
            config.iconBg,
            config.badgeBorder
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Value Counter (JetBrains Mono) */}
      <div className="mt-3">
        <div className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
          {formatINR(displayValue)}
        </div>

        {/* Footer: Subtitle + Sparkline */}
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <TrendingUp className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate font-medium">{subtitle}</span>
          </div>

          <div className="shrink-0 -mb-1">
            <Sparkline
              data={sparklineData}
              stroke={config.sparkStroke}
              fill={config.sparkFill}
              id={variant}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
