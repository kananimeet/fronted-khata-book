"use client";

import React from "react";
import {
  Edit,
  Eye,
  Users as UsersIcon,
  Phone,
  Mail,
  Calendar,
  SearchX,
  UserCheck,
} from "lucide-react";

import { User } from "@/types/auth";
import { getProfilePictureUrl } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  currentUserId?: string | number;
  isAdmin?: boolean;
  onEditUser: (user: User) => void;
  onViewUser: (user: User) => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

export function UsersTable({
  users,
  isLoading,
  currentUserId,
  isAdmin = false,
  onEditUser,
  onViewUser,
  onClearFilters,
  hasFilters = false,
}: UsersTableProps) {
  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Skeleton rows while loading
  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44 md:hidden" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </td>
                  <td className="py-3.5 px-4 hidden lg:table-cell">
                    <Skeleton className="h-3.5 w-24" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-border/80 glass-card p-12 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-400 mb-4 border border-violet-500/20">
          {hasFilters ? <SearchX className="h-7 w-7" /> : <UsersIcon className="h-7 w-7" />}
        </div>
        <h3 className="text-base font-bold text-foreground">
          {hasFilters ? "No matching users found" : "No users found"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
          {hasFilters
            ? "Try adjusting your search query or filter to find users."
            : "No active users are available in the system yet."}
        </p>
        {hasFilters && onClearFilters && (
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={onClearFilters} className="rounded-xl glass-pill">
              Clear Search & Filters
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl glass-card shadow-xl border border-white/60 dark:border-white/10 transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/50 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3.5 px-4">
                User
              </th>
              <th scope="col" className="py-3.5 px-4 hidden md:table-cell">
                Contact Details
              </th>
              <th scope="col" className="py-3.5 px-4">
                Role
              </th>
              <th scope="col" className="py-3.5 px-4">
                Status
              </th>
              <th scope="col" className="py-3.5 px-4 hidden lg:table-cell">
                Created Date
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.map((user) => {
              const profileUrl = getProfilePictureUrl(user.profile_picture);
              const isActive = user.is_active !== false;
              const isSelf = currentUserId !== undefined && String(user.id) === String(currentUserId);
              // Admin can edit anyone; regular user can ONLY edit their own profile!
              const canEdit = isAdmin || isSelf;

              return (
                <tr
                  key={user.id}
                  className={`hover:bg-muted/30 transition-colors group ${
                    isSelf ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  {/* Avatar + Full Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border ring-1 ring-border/50 shrink-0">
                        {profileUrl && (
                          <AvatarImage src={profileUrl} alt={user.name} className="object-cover" />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {user.name}
                          </p>
                          {isSelf && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5">
                              <UserCheck className="h-3 w-3" />
                              You
                            </span>
                          )}
                        </div>
                        {/* Mobile view subtext for email */}
                        <p className="text-xs text-muted-foreground truncate md:hidden">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email & Mobile */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium truncate max-w-[240px]">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{user.mobile || "—"}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    {user.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xs">
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                        Member
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      <span>{formatDate(user.createdAt || user.created_at)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details is visible for all */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onViewUser(user)}
                        title="View user details"
                        aria-label="View user details"
                        className="rounded-xl glass-pill text-muted-foreground hover:text-violet-600 hover:bg-violet-500/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit Button is visible ONLY if Admin or if User editing themselves! */}
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEditUser(user)}
                          title={isSelf ? "Edit your profile" : "Edit user"}
                          aria-label={isSelf ? "Edit your profile" : "Edit user"}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
