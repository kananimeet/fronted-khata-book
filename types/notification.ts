export type NotificationType =
  | "EXPENSE_REQUEST"
  | "EXPENSE_PAYMENT_REQUEST"
  | "EXPENSE_APPROVED"
  | "EXPENSE_PAYMENT_APPROVED"
  | "EXPENSE_REJECTED"
  | "EXPENSE_PAYMENT_REJECTED"
  | "DAILY_EXPENSE_REQUEST"
  | "DAILY_EXPENSE_APPROVED"
  | "DAILY_EXPENSE_REJECTED"
  | "GENERAL";

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPaginationData {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface NotificationListResponse {
  message?: string;
  data: NotificationPaginationData;
}
