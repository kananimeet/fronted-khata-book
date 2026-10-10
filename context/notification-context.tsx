"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/toast";
import { AppNotification } from "@/types/notification";
import {
  getNotifications,
  saveFcmToken,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  sendTestNotification,
} from "@/lib/notification-api";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fcmToken: string | null;
  permission: NotificationPermission | "unsupported";
  requestPermissionAndSyncToken: () => Promise<boolean>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendTestPush: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  const hasSyncedRef = useRef<boolean>(false);

  // Check initial permission status on browser mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setPermission(Notification.permission);
      } else {
        setPermission("unsupported");
      }
    }
  }, []);

  // Fetch notifications from backend
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getNotifications(1, 20);
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e) {
      console.warn("Could not load notifications:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Request notification permission and sync FCM token to backend
  const requestPermissionAndSyncToken = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.warning("Notifications are not supported in this browser.");
      return false;
    }

    try {
      const token = await requestFcmToken();
      setPermission(Notification.permission);

      if (token) {
        setFcmToken(token);
        // Save token to localStorage for fast access
        try {
          localStorage.setItem("khatabook_fcm_token", token);
        } catch {}

        // Send to backend
        const saved = await saveFcmToken(token);
        if (saved) {
          console.log("[NotificationContext] FCM token synced with backend successfully");
          toast.success("Push notifications enabled successfully!", "Notifications Active");
          return true;
        } else {
          console.warn("[NotificationContext] FCM token could not be synced with backend");
          return false;
        }
      } else if (Notification.permission === "denied") {
        toast.warning(
          "Notification permission was denied. Please allow notifications in your browser settings to receive alerts.",
          "Permission Denied"
        );
        return false;
      }
      return false;
    } catch (err) {
      console.error("Error setting up notifications:", err);
      toast.error("Failed to enable notifications. Please check your browser settings.");
      return false;
    }
  }, [toast]);

  // Auto Token Sync on Login or if permission is already granted
  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedRef.current = false;
      return;
    }

    // Refresh notifications list on login
    refreshNotifications();

    // Auto-sync token if notification permission is already granted
    if (typeof window !== "undefined") {
      // If we already have a cached token in localStorage, sync it immediately to DB
      try {
        const storedToken = localStorage.getItem("khatabook_fcm_token");
        if (storedToken) {
          setFcmToken(storedToken);
          saveFcmToken(storedToken).catch(() => {});
        }
      } catch {}

      if ("Notification" in window && Notification.permission === "granted" && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        requestFcmToken().then(async (token) => {
          if (token) {
            setFcmToken(token);
            try {
              localStorage.setItem("khatabook_fcm_token", token);
            } catch {}
            await saveFcmToken(token);
          }
        });
      }
    }
  }, [isAuthenticated, user?.id, refreshNotifications]);

  // Foreground Toast Push Listener
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribe: (() => void) | null = null;

    onForegroundMessage((payload) => {
      const title =
        payload.notification?.title ||
        payload.data?.title ||
        "KhataBook Alert";
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        "You have a new update";

      // Show foreground Toast notification to the user
      toast.info(body, title);

      // Trigger native browser / mobile system popup even in foreground
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                vibrate: [200, 100, 200],
                data: payload.data || {},
              });
            }).catch(() => {});
          } else {
            new Notification(title, {
              body,
              icon: '/icons/icon-192x192.png',
            });
          }
        } catch (e) {
          console.warn('[Foreground Notification] popup warning:', e);
        }
      }

      // Increment unread count & refresh notifications
      setUnreadCount((prev) => prev + 1);
      refreshNotifications();
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated, toast, refreshNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await markNotificationAsRead(id);
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true }))
    );
    setUnreadCount(0);

    const success = await markAllNotificationsAsRead();
    if (success) {
      toast.success("All notifications marked as read");
    }
  }, [toast]);

  // Delete notification
  const deleteItem = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await deleteNotification(id);
    },
    [notifications]
  );

  // Trigger test push
  const sendTestPush = useCallback(async () => {
    const res = await sendTestNotification(
      "Test Push Notification",
      "KhataBook Web Push Notification is working smoothly!"
    );
    if (res.success) {
      toast.success(res.message, "Push Sent");
      return true;
    } else {
      toast.error(res.message, "Push Failed");
      return false;
    }
  }, [toast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fcmToken,
        permission,
        requestPermissionAndSyncToken,
        markAsRead,
        markAllAsRead,
        deleteItem,
        refreshNotifications,
        sendTestPush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
