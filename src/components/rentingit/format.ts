"use client";

export function inr(n: number | string, opts: { decimals?: boolean } = {}): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "₹0";
  return "₹" + num.toLocaleString("en-IN", {
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: 0,
  });
}

export function inrPerDay(n: number): string {
  return inr(n) + "/day";
}

export function dateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(s)} → ${fmt(e)}`;
}

export function daysBetween(start: Date | string, end: Date | string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

export function relativeTime(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    REQUESTED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    PAID: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    PICKED_UP: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
    RETURNED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    DISPUTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    CANCELLED: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    REQUESTED: "Awaiting owner approval",
    APPROVED: "Approved — pay to confirm",
    PAID: "Paid — ready for pickup",
    PICKED_UP: "Picked up",
    RETURNED: "Returned — awaiting owner confirm",
    COMPLETED: "Completed",
    DISPUTED: "Disputed — under review",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}
