"use client";

import React, { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Copy,
  Check,
  Edit,
} from "lucide-react";

import { User } from "@/types/auth";
import { getProfilePictureUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  canEdit?: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: (user: User) => void;
}

export function UserDetailsDialog({
  user,
  open,
  canEdit = true,
  onOpenChange,
  onEditClick,
}: UserDetailsDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const copyId = () => {
    if (user.id) {
      navigator.clipboard.writeText(String(user.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const profileUrl = getProfilePictureUrl(user.profile_picture);
  const isActive = user.is_active !== false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-white/60 dark:border-white/10 glass-card rounded-3xl shadow-2xl">
        {/* Header Banner */}
        <DialogHeader className="p-5 pb-4 border-b border-border/50 bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-fuchsia-600/15">
          <DialogTitle className="text-lg font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-xs">
              <UserIcon className="h-4 w-4" />
            </div>
            Member Profile Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* User Profile Hero Card */}
          <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 backdrop-blur-md shadow-xs space-y-3">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-violet-500/20 shadow-lg shadow-violet-500/10">
                {profileUrl && (
                  <AvatarImage src={profileUrl} alt={user.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 text-violet-600 dark:text-violet-400 text-xl font-extrabold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${
                  isActive ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
              />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-foreground tracking-tight">{user.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 uppercase tracking-wide">
                  <Shield className="h-3 w-3" />
                  {user.role || "USER"}
                </span>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Information Grid */}
          <div className="space-y-2.5 text-xs">
            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold">Email</span>
              </div>
              <span className="font-bold text-foreground truncate max-w-[200px]">
                {user.email}
              </span>
            </div>

            {/* Mobile */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold">Mobile</span>
              </div>
              <span className="font-bold text-foreground">
                {user.mobile || "Not provided"}
              </span>
            </div>

            {/* User ID */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold">User ID</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-foreground font-extrabold bg-muted/60 px-2 py-0.5 rounded-md">
                  {String(user.id)}
                </span>
                <button
                  type="button"
                  onClick={copyId}
                  className="text-muted-foreground hover:text-violet-600 p-1 rounded-md hover:bg-violet-500/10 transition-colors"
                  title="Copy ID"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold">Registered On</span>
              </div>
              <span className="font-semibold text-foreground">
                {formatDate(user.createdAt || user.created_at)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/50 bg-muted/20 backdrop-blur-md flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl glass-pill font-semibold">
            Close
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEditClick(user);
              }}
              className="gap-2 font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl shadow-md shadow-violet-500/25"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
