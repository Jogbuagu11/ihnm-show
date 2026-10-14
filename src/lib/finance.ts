export const STREAMS = {
  sponsors: "Sponsors",
  donations: "Partners / Donations",
  vip: "VIP Tickets",
  rentals: "Studio Rentals",
  worship_video: "Worship Video Packages",
  merch: "Merch",
  youtube: "YouTube",
} as const;
export const EXPENSE_CATEGORIES = ["rent", "utilities", "insurance", "equipment", "shuttle", "hospitality", "ads", "software", "supplies"] as const;
export const DEFAULT_FUNDRAISING_GOAL_CENTS = 2_100_000;

export const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 });
export const monthKey = (d: string) => d.slice(0, 7);

type Dated = { amount_cents: number };

export function sumWhere<T extends Dated>(rows: T[], pred: (r: T) => boolean) {
  return rows.filter(pred).reduce((a, r) => a + r.amount_cents, 0);
}

/** Last N months as "YYYY-MM", oldest first, ending with the month of `now`. */
export function lastMonths(n: number, now = new Date()) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

/** Percent of monthly operating costs covered by income (capped at 100 for the meter). */
export function rentCoveredPct(incomeCents: number, operatingCents: number) {
  if (operatingCents <= 0) return incomeCents > 0 ? 100 : 0;
  return Math.min(100, Math.round((incomeCents / operatingCents) * 100));
}

/** A sent invoice past its due date is overdue. */
export function invoiceStatus(inv: { status: string; due_on: string }, today = new Date().toISOString().slice(0, 10)) {
  if (inv.status === "sent" && inv.due_on < today) return "overdue";
  return inv.status;
}

/** Sponsorships ending within 30 days need a renewal reminder. */
export function needsRenewal(endDate: string | null, today = new Date()) {
  if (!endDate) return false;
  const days = (new Date(endDate + "T00:00:00Z").getTime() - today.getTime()) / 864e5;
  return days >= 0 && days <= 30;
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
