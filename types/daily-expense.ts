import { User } from "./auth";

export type DailyExpenseType = "room" | "own";

export type DailyExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DailyExpenseCategory =
  | "GROCERY"
  | "VEGETABLES"
  | "DAIRY"
  | "GAS_CYLINDER"
  | "WATER"
  | "ELECTRIC_BILL"
  | "Lawyer/Aunty"
  | "Vakil/Masi"
  | string;

export interface DailyExpense {
  id: string | number;
  user_id: string | number;
  user?: User;
  amount: number;
  category: DailyExpenseCategory;
  expense_type: DailyExpenseType;
  expense_date: string;
  note?: string;
  payment_photo?: string | null;
  status: DailyExpenseStatus;
  admin_note?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyExpensePagination {
  total: number;
  page: number;
  totalPages: number;
  limit?: number;
}

export interface DailyExpenseSummary {
  totalAmount: number;
  totalRoomAmount: number;
  approvedRoomAmount?: number;
  totalOwnAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface DailyExpenseListResponse {
  items: DailyExpense[];
  pagination: DailyExpensePagination;
  summary: DailyExpenseSummary;
  success?: boolean;
  message?: string;
}

export interface DailyTrendItem {
  date: string;
  day: number;
  dayOfWeek: string;
  room: number;
  own: number;
  total: number;
  count: number;
}

export interface MonthlyTrendItem {
  year: number;
  month: number;
  monthName: string;
  room: number;
  own: number;
  total: number;
  count: number;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  percentage?: number;
  count?: number;
  room?: number;
  own?: number;
}

export interface DailyExpensesChartResponse {
  dailyTrend: DailyTrendItem[];
  monthlyTrend: MonthlyTrendItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  monthCategoryBreakdown?: CategoryBreakdownItem[];
  yearCategoryBreakdown?: CategoryBreakdownItem[];
  selectedYear?: number;
  selectedMonth?: number;
  summary?: {
    monthTotal?: number;
    monthRoom?: number;
    monthOwn?: number;
    yearTotal?: number;
    yearRoom?: number;
    yearOwn?: number;
    dailyAverage?: number;
    monthlyAverage?: number;
    thisMonthAmount?: number;
    thisMonthRoomAmount?: number;
    thisMonthOwnAmount?: number;
  };
}

export interface DailyExpenseFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  expense_type?: "room" | "own" | "all";
  status?: "PENDING" | "APPROVED" | "REJECTED" | "all";
  category?: string;
  user_id?: string | number;
  startDate?: string;
  endDate?: string;
  forceRefresh?: boolean;
}

export interface CreateDailyExpensePayload {
  amount: number;
  category: string;
  expense_type: DailyExpenseType;
  expense_date: string;
  note?: string;
  payment_photo?: File | null;
}

export interface UpdateDailyExpensePayload {
  amount?: number;
  category?: string;
  expense_type?: DailyExpenseType;
  expense_date?: string;
  note?: string;
  payment_photo?: File | null;
}

export interface CategoryOption {
  id: string;
  label: string;
  iconName: string;
  type: "room" | "own" | "both";
  description: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "GROCERY",
    label: "Groceries",
    iconName: "ShoppingBag",
    type: "room",
    description: "Provisions & essentials",
  },
  {
    id: "VEGETABLES",
    label: "Vegetables",
    iconName: "Apple",
    type: "room",
    description: "Veggies & fresh fruits",
  },
  {
    id: "DAIRY",
    label: "Dairy",
    iconName: "Coffee",
    type: "room",
    description: "Milk, curd & paneer",
  },
  {
    id: "GAS_CYLINDER",
    label: "Gas Cylinder",
    iconName: "Flame",
    type: "room",
    description: "LPG refill charge",
  },
  {
    id: "WATER",
    label: "Water",
    iconName: "Droplets",
    type: "room",
    description: "Drinking water cans",
  },
  {
    id: "ELECTRIC_BILL",
    label: "Electric Bill",
    iconName: "Zap",
    type: "room",
    description: "Power & light bill",
  },
  {
    id: "Lawyer/Aunty",
    label: "Lawyer / Aunty",
    iconName: "Users",
    type: "room",
    description: "Cook & house help",
  },
];
