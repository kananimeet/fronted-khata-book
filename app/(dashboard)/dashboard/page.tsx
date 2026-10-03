import { Metadata } from "next";
import {
  CreditCard,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  Inbox,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard | KhataBook",
  description: "KhataBook administrative dashboard overview",
};

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "₹4,28,450",
      change: "+20.1% from last month",
      icon: DollarSign,
    },
    {
      title: "Active Accounts",
      value: "2,350",
      change: "+180 new this month",
      icon: Users,
    },
    {
      title: "Pending Invoices",
      value: "14",
      change: "-4% from last week",
      icon: FileText,
    },
    {
      title: "Active Ledgers",
      value: "573",
      change: "+19.2% from last month",
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty Content Block */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Recent Activity
          </CardTitle>
          <CardDescription>
            Overview of transactions, ledger entries, and audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center bg-card/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No recent activity
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              There is currently no ledger or transaction activity to display.
              New events will appear here once administrative actions occur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
