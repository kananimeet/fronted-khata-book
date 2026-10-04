import {
  LayoutDashboard,
  Users,
  IndianRupee,
  ShoppingBag,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Room Expenses",
    href: "/expenses",
    icon: IndianRupee,
  },
  {
    title: "Daily Expenses",
    href: "/daily-expenses",
    icon: ShoppingBag,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    adminOnly: true,
  },
];
