import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { getImageUrl } from "./image";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatDate(
  dateString: string | Date | null | undefined,
  includeTime = true
): string {
  if (!dateString) return "N/A";
  try {
    const trimmed = String(dateString).trim();
    if (!trimmed) return "N/A";

    // Date-only string like "YYYY-MM-DD" or UTC midnight "YYYY-MM-DDT00:00:00.000Z"
    const isDateOnly =
      /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
      /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z?$/i.test(trimmed);

    if (isDateOnly) {
      const [year, month, day] = trimmed.split("T")[0].split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    }

    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return trimmed;

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    };

    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.hour12 = true;
    }

    const result = new Intl.DateTimeFormat("en-IN", options).format(d);
    return result.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
  } catch {
    return String(dateString);
  }
}

export function formatTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const result = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
    return result.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
  } catch {
    return String(dateString);
  }
}
