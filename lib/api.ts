import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, clearAuthData } from "./cookies";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Asset / image URL base derived from API_BASE_URL or fallback to http://localhost:5000
export const ASSET_BASE_URL =
  process.env.NEXT_PUBLIC_ASSET_URL ||
  API_BASE_URL.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:5000";

/**
 * Resolves static asset paths (e.g. /uploads/users/...) against backend host.
 */
export function getProfilePictureUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${ASSET_BASE_URL}${cleanPath}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Tunnel-Skip-Anti-Phishing-Page": "true",
  },
});

// Request interceptor: Attach Authorization Bearer token & handle FormData
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When sending FormData, delete Content-Type to let browser/axios set boundary
    if (typeof FormData !== "undefined" && config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

import { invalidateCache } from "./api-cache";
export * from "./api-cache";

// Response interceptor: Invalidate cache on mutations and handle 401 responses
api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (method && ["post", "patch", "put", "delete"].includes(method)) {
      const url = response.config?.url || "";
      if (url.includes("/daily-expenses")) {
        invalidateCache("daily-expenses");
        invalidateCache("expenses");
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("khatabook_daily_expenses_cache");
            localStorage.removeItem("khatabook_dashboard_cache");
            localStorage.removeItem("khatabook_room_expenses_cache");
          } catch {}
        }
      }
      if (url.includes("/expenses")) {
        invalidateCache("expenses");
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("khatabook_dashboard_cache");
            localStorage.removeItem("khatabook_room_expenses_cache");
          } catch {}
        }
      }
      if (url.includes("/users")) {
        invalidateCache("users");
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("khatabook_users_cache");
          } catch {}
        }
      }
      if (url.includes("/settings")) {
        invalidateCache("settings");
      }
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      clearAuthData();
      if (typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/login")) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a human-friendly error message from an API error response.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[]; error?: string; errors?: Array<{ message?: string }> }
      | undefined;

    if (data?.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstMsg = data.errors[0]?.message;
      if (firstMsg) return firstMsg;
    }

    if (err.message === "Network Error") {
      return "Unable to reach the server. Please check your internet connection or backend server.";
    }

    if (err.response?.status === 401) {
      return "Invalid email or password. Please try again.";
    }

    if (err.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (err.response?.status === 404) {
      return "Requested resource was not found.";
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}

export default api;
