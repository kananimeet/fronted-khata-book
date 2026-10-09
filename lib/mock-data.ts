export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  role: "ADMIN" | "MEMBER";
}

export type ExpenseCategory =
  | "Groceries"
  | "Vegetables"
  | "Milk"
  | "Gas"
  | "Utilities"
  | "Other";

export type ExpenseStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface Transaction {
  id: string;
  title: string;
  category: ExpenseCategory;
  categoryColor: string;
  categoryBg: string;
  amount: number;
  date: string;
  paidBy: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  type: "room" | "personal";
  status: ExpenseStatus;
}

export interface DailyExpenseItem {
  day: string;
  dateNumber: number;
  room: number;
  personal: number;
  total: number;
}

export interface CategoryShare {
  name: ExpenseCategory;
  value: number;
  color: string;
  percentage: number;
}

export interface DashboardKPISummary {
  roomRate: number;
  dailyExpenses: number;
  approvedPaid: number;
  pendingApproval: number;
  remainingDue: number;
  groceriesCutAmount: number;
  approvedItemsCount: number;
  collectionRate: number;
  pendingCount: number;
}

export const CURRENT_USER: User = {
  id: "u-1",
  name: "Nirav",
  email: "nirav@khatabook.app",
  initials: "NI",
  role: "ADMIN",
};

export const INITIAL_KPI_SUMMARY: DashboardKPISummary = {
  roomRate: 15630,
  dailyExpenses: 26370,
  approvedPaid: 42000,
  pendingApproval: 0,
  remainingDue: 0,
  groceriesCutAmount: 26370,
  approvedItemsCount: 18,
  collectionRate: 100,
  pendingCount: 0,
};

export const CATEGORY_SHARES: CategoryShare[] = [
  { name: "Groceries", value: 11450, color: "#8b5cf6", percentage: 43.4 }, // Violet
  { name: "Vegetables", value: 5240, color: "#10b981", percentage: 19.9 }, // Emerald
  { name: "Milk", value: 3680, color: "#06b6d4", percentage: 14.0 }, // Cyan
  { name: "Gas", value: 2400, color: "#f97316", percentage: 9.1 }, // Orange
  { name: "Utilities", value: 2100, color: "#ec4899", percentage: 8.0 }, // Pink
  { name: "Other", value: 1500, color: "#6366f1", percentage: 5.6 }, // Indigo
];

export const MOCK_DAILY_CHART_DATA: DailyExpenseItem[] = [
  { day: "01 Oct", dateNumber: 1, room: 1200, personal: 450, total: 1650 },
  { day: "03 Oct", dateNumber: 3, room: 800, personal: 620, total: 1420 },
  { day: "05 Oct", dateNumber: 5, room: 2100, personal: 300, total: 2400 },
  { day: "07 Oct", dateNumber: 7, room: 950, personal: 890, total: 1840 },
  { day: "09 Oct", dateNumber: 9, room: 1750, personal: 410, total: 2160 },
  { day: "11 Oct", dateNumber: 11, room: 1300, personal: 920, total: 2220 },
  { day: "13 Oct", dateNumber: 13, room: 650, personal: 780, total: 1430 },
  { day: "15 Oct", dateNumber: 15, room: 2400, personal: 1100, total: 3500 },
  { day: "17 Oct", dateNumber: 17, room: 890, personal: 450, total: 1340 },
  { day: "19 Oct", dateNumber: 19, room: 1450, personal: 600, total: 2050 },
  { day: "21 Oct", dateNumber: 21, room: 720, personal: 380, total: 1100 },
  { day: "23 Oct", dateNumber: 23, room: 1850, personal: 950, total: 2800 },
  { day: "25 Oct", dateNumber: 25, room: 900, personal: 520, total: 1420 },
  { day: "27 Oct", dateNumber: 27, room: 1100, personal: 740, total: 1840 },
  { day: "29 Oct", dateNumber: 29, room: 570, personal: 260, total: 830 },
];

export const MOCK_YEARLY_CHART_DATA = [
  { day: "May", dateNumber: 5, room: 14200, personal: 6800, total: 21000 },
  { day: "Jun", dateNumber: 6, room: 15800, personal: 7400, total: 23200 },
  { day: "Jul", dateNumber: 7, room: 16100, personal: 8100, total: 24200 },
  { day: "Aug", dateNumber: 8, room: 17400, personal: 9300, total: 26700 },
  { day: "Sep", dateNumber: 9, room: 16900, personal: 8900, total: 25800 },
  { day: "Oct", dateNumber: 10, room: 15630, personal: 10740, total: 26370 },
];

export const MOCK_RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    title: "Monthly Grocery & Provisions",
    category: "Groceries",
    categoryColor: "text-violet-700 dark:text-violet-300",
    categoryBg: "bg-violet-500/15 border-violet-500/30",
    amount: 3850,
    date: "09 Oct, 11:30 AM",
    paidBy: { name: "Nirav", initials: "NI" },
    type: "room",
    status: "APPROVED",
  },
  {
    id: "tx-2",
    title: "Organic Vegetables & Greens",
    category: "Vegetables",
    categoryColor: "text-emerald-700 dark:text-emerald-300",
    categoryBg: "bg-emerald-500/15 border-emerald-500/30",
    amount: 940,
    date: "08 Oct, 06:15 PM",
    paidBy: { name: "Ketan", initials: "KE" },
    type: "room",
    status: "APPROVED",
  },
  {
    id: "tx-3",
    title: "Amul Gold Milk (15 Days Supply)",
    category: "Milk",
    categoryColor: "text-cyan-700 dark:text-cyan-300",
    categoryBg: "bg-cyan-500/15 border-cyan-500/30",
    amount: 1140,
    date: "07 Oct, 08:00 AM",
    paidBy: { name: "Rahul", initials: "RA" },
    type: "room",
    status: "APPROVED",
  },
  {
    id: "tx-4",
    title: "HP Gas Cylinder Refill",
    category: "Gas",
    categoryColor: "text-orange-700 dark:text-orange-300",
    categoryBg: "bg-orange-500/15 border-orange-500/30",
    amount: 1150,
    date: "05 Oct, 03:20 PM",
    paidBy: { name: "Nirav", initials: "NI" },
    type: "room",
    status: "APPROVED",
  },
  {
    id: "tx-5",
    title: "Electricity & High-speed Wifi",
    category: "Utilities",
    categoryColor: "text-pink-700 dark:text-pink-300",
    categoryBg: "bg-pink-500/15 border-pink-500/30",
    amount: 2100,
    date: "02 Oct, 01:10 PM",
    paidBy: { name: "Pooja", initials: "PO" },
    type: "room",
    status: "APPROVED",
  },
  {
    id: "tx-6",
    title: "Personal Snacks & Dryfruits",
    category: "Other",
    categoryColor: "text-indigo-700 dark:text-indigo-300",
    categoryBg: "bg-indigo-500/15 border-indigo-500/30",
    amount: 680,
    date: "01 Oct, 09:45 PM",
    paidBy: { name: "Ketan", initials: "KE" },
    type: "personal",
    status: "APPROVED",
  },
];
