// Mirrors public.rental_price() in SQL — keep both in sync (the server price is what gets booked).
export type RentalType = "podcast" | "package" | "half_day" | "full_day";
export type Addons = { operator?: boolean; edited_video?: boolean; shuttle?: boolean; setup_hours?: number };
export type RentalSettings = {
  podcast_hourly_cents: number; package_hourly_cents: number; half_day_cents: number; full_day_cents: number;
  operator_hourly_cents: number; edited_video_cents: number; shuttle_cents: number; setup_hourly_cents: number;
  deposit_pct: number; security_deposit_cents: number; max_capacity: number; pack_hours: number; pack_discount_pct: number;
};

export const DEFAULT_RENTAL_SETTINGS: RentalSettings = {
  podcast_hourly_cents: 6000, package_hourly_cents: 12000, half_day_cents: 30000, full_day_cents: 50000,
  operator_hourly_cents: 4000, edited_video_cents: 15000, shuttle_cents: 5000, setup_hourly_cents: 3000,
  deposit_pct: 50, security_deposit_cents: 15000, max_capacity: 30, pack_hours: 10, pack_discount_pct: 10,
};

export const RENTAL_TYPES: Record<RentalType, { label: string; blurb: string; fixedHours?: number; minHours?: number }> = {
  podcast: { label: "Podcast / video recording", blurb: "Hourly · 2-hour minimum", minHours: 2 },
  package: { label: "Podcast package", blurb: "Studio + our cameras, mics & an operator · 2-hour minimum", minHours: 2 },
  half_day: { label: "Small event — half day", blurb: "Up to 4 hours", fixedHours: 4 },
  full_day: { label: "Small event — full day", blurb: "Up to 8 hours", fixedHours: 8 },
};

export type Quote = { hours: number; base: number; extras: number; total: number; deposit: number; security: number; packHours: number };

export function quote(type: RentalType, hours: number, addons: Addons, s: RentalSettings = DEFAULT_RENTAL_SETTINGS, packHours = 0): Quote | { error: string } {
  if (hours <= 0) return { error: "End time must be after start time" };
  let base: number; let covered = 0;
  if (type === "podcast" || type === "package") {
    if (hours < 2) return { error: "2-hour minimum" };
    if (type === "podcast") covered = Math.min(Math.max(packHours, 0), hours);
    base = Math.round((hours - covered) * (type === "podcast" ? s.podcast_hourly_cents : s.package_hourly_cents));
  } else if (type === "half_day") {
    if (hours > 4) return { error: "A half day is up to 4 hours" };
    base = s.half_day_cents;
  } else {
    if (hours > 8) return { error: "A full day is up to 8 hours" };
    base = s.full_day_cents;
  }
  let extras = 0;
  if (addons.operator) extras += Math.round(hours * s.operator_hourly_cents);
  if (addons.edited_video) extras += s.edited_video_cents;
  if (addons.shuttle) extras += s.shuttle_cents;
  extras += Math.min(Math.max(addons.setup_hours ?? 0, 0), 4) * s.setup_hourly_cents;
  const total = base + extras;
  return { hours, base, extras, total, deposit: Math.round((total * s.deposit_pct) / 100), security: s.security_deposit_cents, packHours: covered };
}

/** Cancellation refund: 100% 7+ days out, 50% inside 7 days, 0% inside 48 hours. Mirrors cancel_my_rental(). */
export function refundPct(startsAt: Date, now = new Date()) {
  const h = (startsAt.getTime() - now.getTime()) / 36e5;
  return h >= 168 ? 100 : h >= 48 ? 50 : 0;
}

export const packPrice = (s: RentalSettings = DEFAULT_RENTAL_SETTINGS) =>
  Math.round((s.pack_hours * s.podcast_hourly_cents * (100 - s.pack_discount_pct)) / 100);

/** Build a timestamp for a Pacific wall-clock date + "HH:MM". */
export function pacific(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(guess);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asLocal = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  return new Date(guess.getTime() + (guess.getTime() - asLocal));
}
