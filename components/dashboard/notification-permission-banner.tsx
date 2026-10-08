"use client";

import React, { useState, useEffect } from "react";
import { BellRing, X, Loader2, Sparkles } from "lucide-react";
import { useNotifications } from "@/context/notification-context";
import { Button } from "@/components/ui/button";

export function NotificationPermissionBanner() {
  const { permission, requestPermissionAndSyncToken } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if dismissed in this browser session
    try {
      if (sessionStorage.getItem("khatabook_notif_banner_dismissed") === "true") {
        setIsDismissed(true);
      }
    } catch {}
  }, []);

  if (!isMounted) return null;

  // Only show if permission has not been granted yet and user didn't dismiss this session
  if (permission === "granted" || isDismissed) {
    return null;
  }

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      await requestPermissionAndSyncToken();
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("khatabook_notif_banner_dismissed", "true");
    } catch {}
  };

  return (
    <div className="relative overflow-hidden border-b border-primary/20 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 dark:from-blue-500/15 dark:via-indigo-500/15 dark:to-violet-500/15 px-4 py-3 sm:px-6 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <BellRing className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Enable Background Push Notifications
              </p>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <Sparkles className="h-3 w-3" /> Mobile & Desktop
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive alerts for room payments, daily expenses, and approvals even when your phone screen is off or browser is closed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={isEnabling}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs font-medium px-4"
          >
            {isEnabling ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Enabling...
              </>
            ) : (
              "Enable Now"
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 text-xs text-muted-foreground hover:text-foreground px-2.5"
          >
            Later
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground sm:ml-1 p-1 rounded-md"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
