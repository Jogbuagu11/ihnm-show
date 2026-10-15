// Waitlist display + sharing helpers. Pure functions only so they can be unit
// tested and reused by the admin tools.

export const WAITLIST_SOURCES = [
  "Instagram",
  "TikTok",
  "Facebook",
  "YouTube",
  "Church",
  "Friend",
  "Postcard",
  "Nextdoor",
  "Other",
] as const;

export const PARTNER_INTERESTS = [
  "Episode sponsor",
  "Segment sponsor",
  "Special sponsor",
  "Wardrobe",
  "Refreshments",
  "Production",
  "Newsletter feature",
] as const;

/** Spots gained per confirmed referral. Mirrors the 5 in list_position's SQL. */
export const SPOTS_PER_REFERRAL = 5;
/** How many people get first access to tickets. */
export const FIRST_ACCESS_COUNT = 100;

export type JoinResult = {
  already: boolean;
  position: number;
  referral_code: string;
  referral_count: number;
  confirmed: boolean;
  confirm_token: string | null;
  first_name: string;
  email: string;
};

/** The link a member shares. Absolute, because it goes into texts and emails. */
export function referralUrl(code: string, origin?: string): string {
  const base = (origin ?? siteOrigin()).replace(/\/+$/, "");
  return `${base}/?ref=${encodeURIComponent(code)}`;
}

export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://ihnmshow.com";
}

const SHARE_MESSAGE =
  "I just joined the waitlist for IHNM Show — a live talk show where Scripture, history and today's headlines meet. Join me and we both move up:";

/** Share targets for the post-signup screen. */
export function shareLinks(code: string, origin?: string) {
  const url = referralUrl(code, origin);
  const text = `${SHARE_MESSAGE} ${url}`;
  return {
    // Bare "sms:?&body=" is the form that works on both iOS and Android.
    sms: `sms:?&body=${encodeURIComponent(text)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_MESSAGE)}&url=${encodeURIComponent(url)}`,
    email:
      `mailto:?subject=${encodeURIComponent("Be in the first audience — IHNM Show")}` +
      `&body=${encodeURIComponent(`${SHARE_MESSAGE}\n\n${url}`)}`,
  };
}

/** Reads ?ref= and any utm_* parameters off the landing URL. */
export function readUrlAttribution(search: string): {
  ref: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
} {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const get = (k: string) => {
    const v = p.get(k)?.trim();
    return v ? v.slice(0, 120) : null;
  };
  return {
    ref: get("ref") ?? get("r"),
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    utm_term: get("utm_term"),
    utm_content: get("utm_content"),
  };
}

/** Phone digits for tel:/sms: hrefs and for display. */
export function telHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9+]/g, "");
  return digits.length >= 7 ? digits : null;
}

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

/** Countdown to the ticket drop. Returns null when no date is set, so the
 *  hero can hide the block entirely. */
export function countdownTo(
  target: string | null | undefined,
  now: number = Date.now(),
): Countdown | null {
  if (!target) return null;
  const end = new Date(target).getTime();
  if (Number.isNaN(end)) return null;
  const ms = end - now;
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
    done: false,
  };
}

/** "You're #12 on the list." plus the nudge about first access. */
export function positionLabel(position: number): string {
  return `You're #${position.toLocaleString()} on the list.`;
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Quote anything that could break a cell, and double embedded quotes.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const first = rows[0];
  if (!first) return "";
  const cols = columns ?? Object.keys(first);
  const head = cols.map(csvEscape).join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(","));
  return [head, ...body].join("\r\n");
}

/** Parses a pasted/uploaded CSV, honouring quoted fields and CRLF. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (quoted) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text.charAt(i + 1) === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  const headerRow = rows[0];
  if (!headerRow) return [];

  const header = headerRow.map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => {
      o[h] = (r[i] ?? "").trim();
    });
    return o;
  });
}

/** Maps Substack / SMS-tool column names onto import_waitlist's shape. */
export function normalizeImportRow(row: Record<string, string>) {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (v && v.trim()) return v.trim();
    }
    return null;
  };
  const full = pick("name", "full name", "full_name");
  const first = pick("first_name", "first name", "first", "given name");
  const last = pick("last_name", "last name", "last", "surname", "family name");
  const [splitFirst, ...splitRest] = (full ?? "").split(/\s+/).filter(Boolean);
  return {
    email: pick("email", "email address", "e-mail")?.toLowerCase() ?? null,
    phone: pick("phone", "phone number", "mobile", "mobile phone", "number"),
    first_name: first ?? splitFirst ?? null,
    last_name: last ?? (splitRest.length ? splitRest.join(" ") : null),
    zip: pick("zip", "zip code", "postal code", "postcode"),
    sms_opt_in: /^(true|yes|y|1)$/i.test(pick("sms_opt_in", "sms", "sms opt in") ?? ""),
  };
}
