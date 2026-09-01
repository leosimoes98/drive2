import type { Timestamp } from "@/types";

// Convert a backend nanosecond timestamp to a Date. Returns null when invalid.
export function timestampToDate(timestamp: Timestamp): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

// Format a backend timestamp as a localized date + time string.
export function formatTimestamp(timestamp: Timestamp): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format a monetary value as Brazilian Real.
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Format a distance in kilometers.
export function formatDistance(km: number): string {
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

// Shorten a principal id for display.
export function shortPrincipal(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
