import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Home, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";

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
      : 0;

  const stats = [
    {
      title: titlePrefix ? `${titlePrefix} Room Rate` : "Total Room Rate",
      value: formatCurrency(totalRoomRate),
      subtitle: totalUsers ? `${totalUsers} Users tracked` : "Total requested rent",
      icon: Home,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      accent: "from-blue-500/10 to-transparent",
    },
    {
      title: titlePrefix ? `${titlePrefix} Approved` : "Approved Paid",
      value: formatCurrency(totalApproved),
      subtitle: `${collectionRate}% of total collected`,
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      title: titlePrefix ? `${titlePrefix} Pending` : "Pending Approval",
      value: formatCurrency(totalPending),
      subtitle: "Awaiting admin review",
      icon: Clock,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      title: titlePrefix ? `${titlePrefix} Remaining` : "Remaining Due",
      value: formatCurrency(totalRemaining),
      subtitle: "Outstanding balance",
      icon: AlertTriangle,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
      accent: "from-purple-500/10 to-transparent",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-border shadow-xs hover:shadow-md transition-all duration-200"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-50 pointer-events-none`}
            />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${stat.bgColor} ${stat.iconColor} shadow-2xs`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{stat.subtitle}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
