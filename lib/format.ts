/**
 * Currency and formatting utilities for KhataBook
 * Formats numbers into Indian Rupee (INR) representation.
 */

export function formatINR(
  amount: number | string | null | undefined,
  options?: {
    compact?: boolean;
    includeDecimals?: boolean;
  }
): string {
  const val = Number(amount) || 0;

  if (options?.compact && Math.abs(val) >= 1000) {
    if (Math.abs(val) >= 10000000) {
      return `₹${(val / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
    }
    if (Math.abs(val) >= 100000) {
      return `₹${(val / 100000).toFixed(1).replace(/\.0$/, "")}L`;
    }
    return `₹${(val / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: options?.includeDecimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number | string | null | undefined): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-IN").format(num);
}
