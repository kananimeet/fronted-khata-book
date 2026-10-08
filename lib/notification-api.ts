import { api, getApiErrorMessage } from "./api";
import { NotificationPaginationData, NotificationListResponse } from "@/types/notification";

/**
 * Fetch paginated user notifications.
 * GET /notifications?page=1&limit=20
 */
export async function getNotifications(
  page: number = 1,
  limit: number = 20
): Promise<NotificationPaginationData> {
  try {
    const res = await api.get<NotificationListResponse>("/notifications", {
      params: { page, limit },
    });
    if (res.data?.data) {
      return res.data.data;
    }
    // Handle fallback shape
    const anyData = res.data as any;
    return {
      items: anyData?.items || [],
      total: anyData?.total || 0,
      unreadCount: anyData?.unreadCount ?? 0,
      page: anyData?.page || page,
      limit: anyData?.limit || limit,
    };
  } catch (error) {
    console.warn("Failed to fetch notifications:", getApiErrorMessage(error));
    return {
      items: [],
      total: 0,
      unreadCount: 0,
      page,
      limit,
    };
  }
}

/**
 * Save user's browser FCM Token to backend.
 * POST /notifications/fcm-token with fallback to PATCH /users/fcm-token
 */
export async function saveFcmToken(fcmToken: string): Promise<boolean> {
  if (!fcmToken || typeof fcmToken !== "string") return false;

  try {
    const res = await api.post("/notifications/fcm-token", { fcm_token: fcmToken });
    console.log("[saveFcmToken] Token synced via /notifications/fcm-token:", res.data?.message);
    return true;
  } catch (err) {
    console.warn("[saveFcmToken] /notifications/fcm-token failed, trying /users/fcm-token:", getApiErrorMessage(err));
    // Try fallback endpoint
    try {
      const fallbackRes = await api.patch("/users/fcm-token", { fcm_token: fcmToken });
      console.log("[saveFcmToken] Token synced via fallback /users/fcm-token:", fallbackRes.data?.message);
      return true;
    } catch (fallbackErr) {
      console.error("[saveFcmToken] Could not sync FCM token to backend:", getApiErrorMessage(fallbackErr));
      return false;
    }
  }
}

/**
 * Mark a single notification as read.
 * PATCH /notifications/:id/read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    await api.patch(`/notifications/${id}/read`);
    return true;
  } catch (error) {
    console.error(`Failed to mark notification ${id} as read:`, getApiErrorMessage(error));
    return false;
  }
}

/**
 * Mark all user notifications as read.
 * PATCH /notifications/read-all
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    await api.patch("/notifications/read-all");
    return true;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", getApiErrorMessage(error));
    return false;
  }
}

/**
 * Delete a notification.
 * DELETE /notifications/:id
 */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    await api.delete(`/notifications/${id}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete notification ${id}:`, getApiErrorMessage(error));
    return false;
  }
}

/**
 * Send a test push notification to verify FCM setup.
 * POST /notifications/test
 */
export async function sendTestNotification(
  title: string = "KhataBook Test Notification",
  body: string = "Testing web push notifications successfully!"
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.post("/notifications/test", { title, body });
    return {
      success: true,
      message: res.data?.message || "Test push notification sent successfully!",
    };
  } catch (error) {
    const errorMsg = getApiErrorMessage(error, "Failed to send test push notification.");
    return { success: false, message: errorMsg };
  }
}
