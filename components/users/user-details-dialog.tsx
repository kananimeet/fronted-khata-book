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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">User Details</DialogTitle>
        </DialogHeader>

        {/* User Profile Card */}
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <Avatar className="h-20 w-20 ring-4 ring-primary/10 shadow-md">
            {profileUrl && (
              <AvatarImage src={profileUrl} alt={user.name} className="object-cover" />
            )}
            <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-lg font-bold text-foreground">{user.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-semibold gap-1">
                <Shield className="h-3 w-3 text-primary" />
                {user.role || "USER"}
              </Badge>
              {isActive ? (
                <Badge variant="success" className="text-xs">
                  Active
                </Badge>
              ) : (
                <Badge variant="inactive" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="space-y-3 py-2 text-sm">
          {/* Email */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/60">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium">Email</span>
            </div>
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {user.email}
            </span>
          </div>

          {/* Mobile */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/60">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium">Mobile</span>
            </div>
            <span className="font-semibold text-foreground">
              {user.mobile || "Not provided"}
            </span>
          </div>

          {/* User ID */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/60">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <UserIcon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium">User ID</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-foreground font-semibold">
                {String(user.id)}
              </span>
              <button
                type="button"
                onClick={copyId}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
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
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/60">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium">Created On</span>
            </div>
            <span className="text-xs font-medium text-foreground">
              {formatDate(user.createdAt || user.created_at)}
            </span>
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEditClick(user);
              }}
              className="gap-2 font-semibold"
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
