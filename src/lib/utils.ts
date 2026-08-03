import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(iso)
  );
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ActivityLogEntry.action is a snake_case verb ("saved_email_attachment") —
// this is the one place that turns it into copy a person reads, shared by
// the Activity Log module and the Dashboard's "What changed today" card so
// the same raw action always reads the same way everywhere it's shown.
export function humanizeAction(action: string): string {
  return action.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

// "Today" / "Yesterday" / "N days ago" / short date — the same relative
// framing the demo's mock activity feed uses (DEMO_ACTIVITY timestamps),
// so a real workspace's feed reads the same way instead of a raw
// toLocaleDateString().
export function relativeTime(date: Date): string {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
