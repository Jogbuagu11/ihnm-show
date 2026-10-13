import studio from "@/assets/studio.jpg";
import audience from "@/assets/audience.jpg";
import worship from "@/assets/worship.jpg";
import panel from "@/assets/panel.jpg";
import sitdown from "@/assets/sitdown.jpg";

export const LOCATION = "Studio A, San Jose";
export const TZ = "America/Los_Angeles";

export const images: Record<string, string> = { studio, audience, worship, panel, sitdown };
export function thumb(key?: string | null) {
  return images[key ?? ""] ?? studio;
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: TZ,
  });
}
export function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
}
export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
}

/** Shuttle loop departure times, e.g. 18:00 → 18:45 every 15 min. */
export function shuttleLoops(start: string, end: string, intervalMin: number): string[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const out: string[] = [];
  const step = Math.max(1, intervalMin);
  for (let m = toMin(start); m <= toMin(end); m += step) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export function fmtClock(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function youtubeEmbed(url?: string | null) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export const kindLabel = { episode: "Episode", sitdown: "Sit-Down", special: "Special" } as const;
