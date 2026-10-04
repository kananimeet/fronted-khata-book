"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/auth";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setUser(getStoredUser());
    setTokenState(getToken() ?? null);
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, redirectPath = "/dashboard") => {
    // Clear any previous session caches
    if (typeof window !== "undefined") {
      try {
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
    router.push(redirectPath);
    router.refresh();
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      try {
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
      if (!prev) return null;
      const updated = { ...prev, ...partial };
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
