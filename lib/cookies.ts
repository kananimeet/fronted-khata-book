import Cookies from "js-cookie";
import { User } from "@/types/auth";

export const TOKEN_COOKIE_KEY = "auth_token";
export const USER_COOKIE_KEY = "auth_user";

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE_KEY);
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_COOKIE_KEY, token, {
    expires: 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function removeToken(): void {
  Cookies.remove(TOKEN_COOKIE_KEY, { path: "/" });
}

export function getStoredUser(): User | null {
  const userJson = Cookies.get(USER_COOKIE_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  Cookies.set(USER_COOKIE_KEY, JSON.stringify(user), {
    expires: 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function removeStoredUser(): void {
  Cookies.remove(USER_COOKIE_KEY, { path: "/" });
}

export function clearAuthData(): void {
  removeToken();
  removeStoredUser();
}
