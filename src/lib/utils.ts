import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const DEFAULT_CURRENCY = "GBP";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveCurrency(currency?: string | null) {
  const normalized = currency?.trim().toUpperCase();
  return !normalized || normalized === "USD" ? DEFAULT_CURRENCY : normalized;
}

export function formatCurrency(cents: number, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: resolveCurrency(currency) }).format(cents / 100);
}
