import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

/** Everything the prelaunch page reads is admin-editable, so the page falls
 *  back to these only when the settings row can't be loaded at all. */
export const SETTINGS_FALLBACK = {
  id: 1,
  giving_enabled: false,
  merch_enabled: false,
  ticket_drop_at: null,
  sms_keyword: "IHNM",
  sms_number: null,
  substack_url: null,
  url_youtube: null,
  url_instagram: null,
  url_tiktok: null,
  url_facebook: null,
  url_threads: null,
  url_nextdoor: null,
  media_kit_path: null,
  hero_headline: "Be in the first audience.",
  hero_subline:
    "A live talk show where Scripture, history and today's headlines meet. Studio A, San Jose · Launching early 2027.",
  weekly_position_emails: false,
  require_email_confirm: false,
} satisfies SiteSettings;

export const siteSettingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async (): Promise<SiteSettings> => {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    return data ?? SETTINGS_FALLBACK;
  },
});

/** Public URL for the admin-uploaded media kit, or the bundled placeholder. */
export function mediaKitUrl(settings: Pick<SiteSettings, "media_kit_path"> | undefined): string {
  if (!settings?.media_kit_path) return "/ihnm-media-kit.pdf";
  const { data } = supabase.storage.from("media").getPublicUrl(settings.media_kit_path);
  return data.publicUrl;
}

export const SOCIAL_FIELDS = [
  { key: "url_youtube", label: "YouTube" },
  { key: "url_instagram", label: "Instagram" },
  { key: "url_tiktok", label: "TikTok" },
  { key: "url_facebook", label: "Facebook" },
  { key: "url_nextdoor", label: "Nextdoor" },
  { key: "substack_url", label: "Substack" },
] as const satisfies readonly { key: keyof SiteSettings; label: string }[];
