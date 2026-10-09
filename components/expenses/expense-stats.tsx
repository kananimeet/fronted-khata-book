"use client";

import React from "react";
import { formatINR } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { Home, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface ExpenseStatsProps {
  totalRoomRate: number;
  totalApproved: number;
  totalPending: number;
  totalRemaining: number;
  totalUsers?: number;
  titlePrefix?: string;
}

export function ExpenseStats({
  totalRoomRate = 0,
  totalApproved = 0,
  totalPending = 0,
  totalRemaining = 0,
  totalUsers,
  titlePrefix,
}: ExpenseStatsProps) {
  const collectionRate =
    totalRoomRate > 0
      ? Math.min(100, Math.round((totalApproved / totalRoomRate) * 100))
      : totalApproved > 0
      ? 100
      : 0;

  const stats = [
    {
      title: titlePrefix ? `${titlePrefix} Room Rate` : "Total Room Rate",
      value: totalRoomRate,
      subtitle: totalUsers ? `${totalUsers} Users tracked` : "Total requested rent",
      icon: Home,
      variant: "blue" as const,
      sparklineData: [
        totalRoomRate * 0.85,
        totalRoomRate * 0.9,
        totalRoomRate * 0.95,
        totalRoomRate,
      ],
    },
    {
      title: titlePrefix ? `${titlePrefix} Approved` : "Approved Paid",
      value: totalApproved,
      subtitle: `${collectionRate}% of total collected`,
      icon: CheckCircle2,
      variant: "emerald" as const,
      sparklineData: [
        totalApproved * 0.7,
        totalApproved * 0.85,
        totalApproved * 0.95,
        totalApproved,
      ],
    },
    {
      title: titlePrefix ? `${titlePrefix} Pending` : "Pending Approval",
      value: totalPending,
      subtitle: "Awaiting admin review",
      icon: Clock,
      variant: "amber" as const,
      sparklineData: [totalPending * 1.2, totalPending * 1.1, totalPending],
    },
    {
      title: titlePrefix ? `${titlePrefix} Remaining` : "Remaining Due",
      value: totalRemaining,
      subtitle: "Outstanding balance due",
      icon: AlertTriangle,
      variant: "rose" as const,
      sparklineData: [totalRemaining * 1.3, totalRemaining * 1.1, totalRemaining],
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
