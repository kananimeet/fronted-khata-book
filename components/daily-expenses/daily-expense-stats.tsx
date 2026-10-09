"use client";

import React from "react";
import { formatINR } from "@/lib/format";
import { DailyExpenseSummary } from "@/types/daily-expense";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Wallet,
  Home,
  User as UserIcon,
  Clock,
} from "lucide-react";

interface DailyExpenseStatsProps {
  summary?: DailyExpenseSummary;
  isLoading?: boolean;
  totalApprovedPaid?: number;
}

export function DailyExpenseStats({
  summary,
  isLoading = false,
  totalApprovedPaid,
}: DailyExpenseStatsProps) {
  const totalAmount = summary?.totalAmount ?? 0;
  const totalRoomAmount = summary?.totalRoomAmount ?? 0;
  const totalOwnAmount = summary?.totalOwnAmount ?? 0;
  const pendingCount = summary?.pendingCount ?? 0;
  const approvedCount = summary?.approvedCount ?? 0;

  const remainingRoomFund =
    totalApprovedPaid !== undefined && totalApprovedPaid > 0
      ? Math.max(0, totalApprovedPaid - totalRoomAmount)
      : null;

  const stats = [
    {
      title: "Total Spent",
      value: totalAmount,
      subtitle: `${approvedCount} approved expenses recorded`,
      icon: Wallet,
      variant: "blue" as const,
      sparklineData: [totalAmount * 0.75, totalAmount * 0.88, totalAmount * 0.94, totalAmount],
    },
    {
      title: "Room Expenses",
      value: totalRoomAmount,
      subtitle:
        remainingRoomFund !== null
          ? `${formatINR(remainingRoomFund)} pool balance remaining`
          : "Credited towards room rent",
      icon: Home,
      variant: "violet" as const,
      sparklineData: [totalRoomAmount * 0.8, totalRoomAmount * 0.9, totalRoomAmount],
    },
    {
      title: "Personal Expenses",
      value: totalOwnAmount,
      subtitle: "Settled individually by user",
      icon: UserIcon,
      variant: "rose" as const,
      sparklineData: [totalOwnAmount * 0.85, totalOwnAmount * 0.92, totalOwnAmount],
    },
    {
      title: "Pending Approvals",
      value: pendingCount,
      subtitle: pendingCount === 1 ? "1 item awaiting review" : `${pendingCount} items awaiting review`,
      icon: Clock,
      variant: "amber" as const,
      sparklineData: [pendingCount * 1.5, pendingCount * 1.2, pendingCount],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          variant={stat.variant}
          sparklineData={stat.sparklineData}
          delay={idx}
        />
      ))}
    </div>
  );
}
