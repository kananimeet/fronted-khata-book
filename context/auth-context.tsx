"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/auth";
import { api } from "@/lib/api";
import {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  clearAuthData,
} from "@/lib/cookies";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User, redirectPath?: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  syncCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncCurrentUser = async () => {
    const activeToken = getToken();
    const stored = getStoredUser();
    if (!activeToken || !stored?.id) return;

    try {
      // 1. Try GET /users/:id
      try {
        const res = await api.get(`/users/${stored.id}`);
        const freshUser = res.data?.data?.user || res.data?.data || res.data?.user;
        if (freshUser && (freshUser.id || freshUser.email)) {
          updateUser(freshUser);
          return;
        }
      } catch {
        // Fallback to GET /users?search=
      }

      // 2. Fallback to GET /users?search=email
      if (stored.email) {
        const res = await api.get("/users", {
          params: { search: stored.email.trim(), limit: 10 },
        });
        const usersList = res.data?.data?.users;
        if (Array.isArray(usersList)) {
          const found = usersList.find(
            (u: User) =>
              String(u.id) === String(stored.id) ||
              u.email?.toLowerCase() === stored.email?.toLowerCase()
          );
          if (found) {
            updateUser(found);
          }
        }
      }
    } catch (err) {
      console.warn("Background user sync skipped:", err);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    const initialToken = getToken() ?? null;
    setTokenState(initialToken);
    setIsLoading(false);

    // Sync latest user profile from server in background if authenticated
    if (initialToken && stored?.id) {
      syncCurrentUser();
    }
  }, []);

  const login = (newToken: string, newUser: User, redirectPath = "/dashboard") => {
    // Clear any previous session caches
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("bachelorsbook_daily_expenses_cache");
        localStorage.removeItem("bachelorsbook_dashboard_cache");
        localStorage.removeItem("bachelorsbook_room_expenses_cache");
        localStorage.removeItem("bachelorsbook_users_cache");
        localStorage.removeItem("khatabook_daily_expenses_cache");
        localStorage.removeItem("khatabook_dashboard_cache");
        localStorage.removeItem("khatabook_room_expenses_cache");
        localStorage.removeItem("khatabook_users_cache");
      } catch {}
    }
    setToken(newToken);
    setStoredUser(newUser);
    setTokenState(newToken);
    setUser(newUser);
    if (typeof window !== "undefined") {
      window.location.href = redirectPath;
    } else {
      router.push(redirectPath);
      router.refresh();
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("bachelorsbook_daily_expenses_cache");
        localStorage.removeItem("bachelorsbook_dashboard_cache");
        localStorage.removeItem("bachelorsbook_room_expenses_cache");
        localStorage.removeItem("bachelorsbook_users_cache");
        localStorage.removeItem("khatabook_daily_expenses_cache");
        localStorage.removeItem("khatabook_dashboard_cache");
        localStorage.removeItem("khatabook_room_expenses_cache");
        localStorage.removeItem("khatabook_users_cache");
      } catch {}
    }
    clearAuthData();
    setTokenState(null);
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      const base = prev || getStoredUser() || ({} as User);
      const updated = { ...base, ...partial };
      setStoredUser(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
        syncCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
