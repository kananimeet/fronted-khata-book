"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  UserPen,
  Users,
  Shield,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfilePictureUrl } from "@/lib/api";
import { UserEditDialog } from "@/components/users/user-edit-dialog";

const emptySubscribe = () => () => {};

export function UserNav() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const displayRole = user?.role || "Member";
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const profileUrl = getProfilePictureUrl(user?.profile_picture);

  if (!mounted) {
    return (
      <div className="relative flex items-center p-1">
        <div className="h-9 w-9 rounded-full bg-primary/10 border border-border" />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group relative flex items-center gap-2 rounded-full p-0.5 text-sm outline-none ring-offset-background transition-all hover:scale-105 hover:ring-2 hover:ring-violet-500/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open user menu"
          >
            <Avatar className="h-9 w-9 border border-border shadow-xs transition-transform">
              {profileUrl && (
                <AvatarImage
                  src={profileUrl}
                  alt={displayName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 text-violet-600 dark:text-violet-400 font-extrabold text-xs">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 p-2 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/20 dark:shadow-black/60 opacity-100 z-50 backdrop-blur-none"
          align="end"
          forceMount
        >
          {/* User Profile Header Card - Clicking this opens Edit Profile */}
          <DropdownMenuLabel className="p-0 font-normal">
            <button
              type="button"
              onClick={() => setEditDialogOpen(true)}
              className="group/card w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-xs"
              title="Click to edit profile"
            >
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 border-2 border-violet-500/30 shadow-md">
                  {profileUrl && (
                    <AvatarImage
                      src={profileUrl}
                      alt={displayName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 text-violet-600 dark:text-violet-400 font-extrabold text-sm">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-xs group-hover/card:scale-110 transition-transform">
                  <UserPen className="h-2.5 w-2.5" />
                </span>
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-extrabold text-foreground truncate group-hover/card:text-violet-600 dark:group-hover/card:text-violet-400 transition-colors">
                    {displayName}
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/card:text-violet-500 group-hover/card:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground truncate font-normal">
                  {displayEmail}
                </p>
                <div className="flex items-center justify-between gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25">
                    {isAdmin ? (
                      <>
                        <Shield className="h-2.5 w-2.5" />
                        Admin
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-2.5 w-2.5" />
                        {displayRole}
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold group-hover/card:underline">
                    Edit Profile &rarr;
                  </span>
                </div>
              </div>
            </button>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2 bg-border/50" />

          {/* Edit Profile Menu Item */}
          <DropdownMenuItem
            className="cursor-pointer gap-3 p-2.5 rounded-xl font-medium hover:bg-violet-500/10 focus:bg-violet-500/10 focus:text-violet-600 dark:focus:text-violet-400 transition-colors"
            onSelect={() => setEditDialogOpen(true)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
              <UserPen className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground">Edit Profile</span>
              <span className="text-[10px] text-muted-foreground">
                Change photo, name, email & password
              </span>
            </div>
          </DropdownMenuItem>

          {/* Users Directory */}
          <DropdownMenuItem
            className="cursor-pointer gap-3 p-2.5 rounded-xl font-medium hover:bg-muted focus:bg-muted transition-colors"
            onSelect={() => router.push("/users")}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground">Users Directory</span>
              <span className="text-[10px] text-muted-foreground">
                Browse team members & roles
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2 bg-border/50" />

          {/* Log Out */}
          <DropdownMenuItem
            className="cursor-pointer gap-3 p-2.5 rounded-xl font-medium text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
            onClick={logout}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
              <LogOut className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold">Log out</span>
              <span className="text-[10px] text-muted-foreground">
                Sign out of your session
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Modal Dialog */}
      {user && (
        <UserEditDialog
          user={user}
          open={editDialogOpen}
          isAdmin={isAdmin}
          onOpenChange={setEditDialogOpen}
          onUserUpdated={() => {}}
        />
      )}
    </>
  );
}
