"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  RotateCw,
  Filter,
  X,
  Shield,
  UserCheck,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { User, UsersListResponse } from "@/types/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UsersTable } from "@/components/users/users-table";
import { UsersPagination } from "@/components/users/users-pagination";
import { UserCreateDialog } from "@/components/users/user-create-dialog";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { UserDetailsDialog } from "@/components/users/user-details-dialog";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;

  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 300ms Debounce for Search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1); // Reset to page 1 on new search query
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Users
  const fetchUsers = useCallback(
    async (page = 1, showRefreshSpinner = false) => {
      if (showRefreshSpinner) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const params: Record<string, string | number> = {
          page,
          limit: pageSize,
        };

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        if (statusFilter === "active") {
          params.is_active = "true";
        } else if (statusFilter === "inactive") {
          params.is_active = "false";
        }

        const response = await api.get<UsersListResponse>("/users", { params });
        const data = response.data?.data;

        if (data) {
          startTransition(() => {
            setUsers(data.users || []);
            setTotalUsers(data.total || 0);
            setCurrentPage(data.page || page);
            setTotalPages(data.totalPages || 1);
          });
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load users directory"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [debouncedSearch, statusFilter, toast]
  );

  // Trigger fetch when debouncedSearch, statusFilter, or page changes
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, debouncedSearch, statusFilter, fetchUsers]);

  // Handlers for Modals
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleViewClick = (user: User) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(searchInput.trim() || statusFilter !== "all");

  const canEditSelectedUser =
    isAdmin ||
    (selectedUser !== null &&
      currentUser !== null &&
      String(selectedUser.id) === String(currentUser.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Users Directory
                </h1>
                <Badge
                  variant={isAdmin ? "default" : "secondary"}
                  className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5"
                >
                  {isAdmin ? (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Admin View
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" /> Member View
                    </span>
                  )}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isAdmin
                  ? "Manage accounts, create users, update permissions and monitor access."
                  : "View all member profiles. You can edit and update your own profile."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchUsers(currentPage, true)}
            disabled={isLoading || isRefreshing}
            title="Refresh table"
            aria-label="Refresh table"
            className="h-9 w-9"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          </Button>

          {/* Add New User is visible ONLY to ADMIN */}
          {isAdmin && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 font-semibold shadow-xs h-9"
            >
              <UserPlus className="h-4 w-4" />
              Add New User
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-xs">
        {/* Search Input (Debounced 300ms) */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, or mobile..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9.5 pr-8 bg-background"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | "active" | "inactive");
                setCurrentPage(1);
              }}
              aria-label="Filter users by status"
              className="h-9 rounded-md border border-input bg-background pl-9 pr-8 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-all cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-9 px-2 text-muted-foreground hover:text-destructive"
              title="Reset all filters"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Users Table with Role-based edit control */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        currentUserId={currentUser?.id}
        isAdmin={isAdmin}
        onEditUser={handleEditClick}
        onViewUser={handleViewClick}
        onClearFilters={handleClearFilters}
        hasFilters={hasActiveFilters}
      />

      {/* Pagination */}
      <UsersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalUsers}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        isLoading={isLoading}
      />

      {/* Create User Dialog (Admin Only) */}
      {isAdmin && (
        <UserCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onUserCreated={() => fetchUsers(1)}
        />
      )}

      {/* Edit User Dialog (Admin or Own Profile) */}
      <UserEditDialog
        user={selectedUser}
        open={editDialogOpen}
        isAdmin={isAdmin}
        onOpenChange={setEditDialogOpen}
        onUserUpdated={() => fetchUsers(currentPage)}
      />

      {/* View User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={detailsDialogOpen}
        canEdit={canEditSelectedUser}
        onOpenChange={setDetailsDialogOpen}
        onEditClick={handleEditClick}
      />
    </div>
  );
}
