"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Send,
  RefreshCw,
  Receipt,
  ShoppingCart,
  AlertCircle,
  ExternalLink,
  Volume2,
} from "lucide-react";

import { useNotifications } from "@/context/notification-context";
import { AppNotification } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatTimeAgo(dateString: string): string {
  if (!dateString) return "Recently";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getNotificationIcon(type: string) {
  if (type?.includes("DAILY")) {
    return <ShoppingCart className="h-4 w-4 text-amber-500 shrink-0" />;
  }
  if (type?.includes("EXPENSE")) {
    return <Receipt className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  return <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" />;
}

export function NotificationBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    permission,
    requestPermissionAndSyncToken,
    markAsRead,
    markAllAsRead,
    deleteItem,
    refreshNotifications,
    sendTestPush,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    // Determine target link from data or notification type
    const link =
      notif.data?.link ||
      (notif.type?.includes("DAILY") ? "/daily-expenses" : "/expenses");

    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  };

  const handleTestPush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTesting(true);
    await sendTestPush();
    setIsTesting(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-5 w-5 transition-transform duration-200 active:scale-90" />

          {unreadCount > 0 && (
            <>
              {/* Pulsing indicator aura */}
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
              </span>

              {/* Unread number badge */}
              <span className="absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] sm:w-[420px] p-0 shadow-2xl border-border/80 bg-card/95 backdrop-blur-xl rounded-xl overflow-hidden"
      >
        {/* Dropdown Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0 font-semibold text-base text-foreground">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 ? (
              <Badge variant="secondary" className="text-xs bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold px-2">
                {unreadCount} new
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                All caught up
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}
          </div>
        </div>

        {/* Permission Request Alert Banner (if notifications not yet enabled) */}
        {permission !== "granted" && (
          <div className="bg-blue-500/10 dark:bg-blue-500/15 border-b border-blue-500/20 px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Volume2 className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-xs text-foreground font-medium truncate">
                Enable background push alerts
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
              onClick={requestPermissionAndSyncToken}
            >
              Enable
            </Button>
          </div>
        )}

        {/* Notifications Scroll Area */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
          {notifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 mb-3 text-muted-foreground">
                <Bell className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                Important expense requests, approvals, and reminders will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer select-none ${
                  item.is_read
                    ? "bg-transparent hover:bg-muted/40 opacity-75 hover:opacity-100"
                    : "bg-blue-500/[0.04] dark:bg-blue-500/[0.08] hover:bg-blue-500/[0.08] dark:hover:bg-blue-500/[0.12]"
                }`}
              >
                {/* Unread indicator dot */}
                {!item.is_read && (
                  <span className="absolute top-4 left-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm" />
                )}

                {/* Notification Icon */}
                <div className="mt-0.5 rounded-lg p-2 bg-muted/60 border border-border/50">
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-sm truncate ${
                        item.is_read ? "font-medium text-foreground" : "font-semibold text-foreground"
                      }`}
                    >
                      {item.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed break-words">
                    {item.message}
                  </p>
                </div>

                {/* Item Action Buttons */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.is_read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Test Push and View options */}
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2.5 bg-muted/30 flex items-center justify-between gap-2 text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestPush}
            disabled={isTesting}
            className="h-7 text-xs border-dashed text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <Send className="h-3 w-3 text-blue-500" />
            <span>{isTesting ? "Testing..." : "Send Test Push"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              router.push("/expenses");
            }}
            className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <span>Expenses</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
