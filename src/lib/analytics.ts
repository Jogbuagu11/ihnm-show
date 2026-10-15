// Google Analytics events. Silent no-op until VITE_GA_MEASUREMENT_ID is set,
// so nothing breaks in dev or before the property exists.

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };

export const GA_ID: string | undefined = import.meta.env["VITE_GA_MEASUREMENT_ID"];

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  if (typeof w.gtag === "function") {
    w.gtag("event", event, params);
  } else if (import.meta.env.DEV) {
    console.debug(`[analytics] ${event}`, params);
  }
}

/** The three conversions the brief asks for. */
export const trackSignup = (p: { position: number; source: string | null; referred: boolean }) =>
  track("waitlist_signup", {
    position: p.position,
    signup_source: p.source ?? "unknown",
    referred: p.referred,
  });

export const trackReferralShare = (channel: string) => track("referral_share", { channel });

export const trackMediaKitDownload = () => track("media_kit_download", {});
