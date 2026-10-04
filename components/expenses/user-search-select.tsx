"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { User } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  Check,
  ChevronsUpDown,
  X,
  User as UserIcon,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";

interface UserSearchSelectProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (userId: string, user: User | null) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  id?: string;
}

export function UserSearchSelect({
  users,
  selectedUserId,
  onSelectUser,
  isLoading = false,
  error = null,
  onRetry,
  disabled = false,
  hasError = false,
  placeholder = "Select user...",
  id = "user_search_select",
}: UserSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find currently selected user object
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return users.find((u) => String(u.id) === String(selectedUserId)) || null;
  }, [users, selectedUserId]);

  // Filter users based on search query (name, mobile, email)
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const mobile = (u.mobile || "").toLowerCase();
      return name.includes(q) || email.includes(q) || mobile.includes(q);
    });
  }, [users, searchQuery]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll active item into view when navigating with keyboard
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLButtonElement>(
        "[data-user-item]"
      );
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [activeIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredUsers.length) {
          const user = filteredUsers[activeIndex];
          onSelectUser(String(user.id), user);
          setIsOpen(false);
          setSearchQuery("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
      default:
        break;
    }
  };

  const handleSelect = (user: User) => {
    onSelectUser(String(user.id), user);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectUser("", null);
    setSearchQuery("");
  };

  // Formatted trigger label
  const getTriggerText = () => {
    if (!selectedUser) return null;
    const secondary = selectedUser.mobile || selectedUser.email;
    return secondary
      ? `${selectedUser.name} (${secondary})`
      : selectedUser.name;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex h-10 items-center justify-between rounded-lg border bg-background px-3 py-2 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-destructive text-destructive focus:ring-destructive"
            : "border-input hover:border-muted-foreground/40",
          isOpen ? "border-primary ring-2 ring-primary/20" : ""
        )}
      >
        <div className="flex items-center gap-2.5 truncate mr-2">
          {selectedUser ? (
            <>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                {selectedUser.name?.charAt(0) || "U"}
              </div>
              <span className="truncate font-semibold text-foreground text-xs sm:text-sm">
                {getTriggerText()}
              </span>
            </>
          ) : (
            <>
              <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-xs sm:text-sm">
                {isLoading ? "Loading users..." : placeholder}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {selectedUser && !disabled && (
            <span
              role="button"
              tabIndex={0}
              title="Clear selection"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Box Header */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search user by name, mobile, email..."
                className="pl-8 pr-8 h-8 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between pt-1.5 px-1 text-[11px] text-muted-foreground">
              <span>{filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"} available</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto p-1.5 space-y-0.5"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading users list...</span>
              </div>
            ) : error ? (
              <div className="py-4 px-3 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs text-destructive font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry Loading Users
                  </button>
                )}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">No users found</p>
                <p className="text-[11px]">
                  {searchQuery
                    ? `No users match "${searchQuery}"`
                    : "No users currently registered."}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[11px] text-primary hover:underline mt-1 font-semibold block mx-auto"
                  >
                    Clear search query
                  </button>
                )}
              </div>
            ) : (
              filteredUsers.map((user, idx) => {
                const isSelected =
                  String(user.id) === String(selectedUserId);
                const isActive = activeIndex === idx;
                const secondary = user.mobile || user.email;

                return (
                  <button
                    key={String(user.id)}
                    data-user-item
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(user)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : isActive
                        ? "bg-muted text-foreground"
                        : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {user.name}
                          {secondary && (
                            <span className="font-normal text-muted-foreground ml-1.5 text-[11px]">
                              ({secondary})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                          {user.mobile && (
                            <span className="inline-flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {user.mobile}
                            </span>
                          )}
                          {user.email && (
                            <span className="inline-flex items-center gap-0.5 truncate">
                              <Mail className="h-2.5 w-2.5" />
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
