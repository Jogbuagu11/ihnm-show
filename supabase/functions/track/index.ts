// /r/{token} — records a click and redirects. Clicks are measured here because
// open tracking is unreliable and increasingly blocked.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.ihnmshow.com";
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const token = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";
  if (!token) return Response.redirect(SITE_URL, 302);

  const { data: link } = await admin
    .from("tracked_links")
    .select("token, url, contact_id, campaign, topic_tags")
    .eq("token", token)
    .maybeSingle();

  // An unknown token still sends the reader somewhere useful.
  if (!link) return Response.redirect(SITE_URL, 302);

  // Recording must never delay or block the redirect.
  try {
    await admin.from("link_clicks").insert({ token: link.token, contact_id: link.contact_id });
    if (link.contact_id) {
      await admin.rpc("log_contact_event", {
        _contact: link.contact_id,
        _type: "link_clicked",
        _payload: {
          url: link.url,
          campaign: link.campaign,
          topic_tags: link.topic_tags ?? [],
        },
      });
      // Topic tags become interests, which is what the topic journeys read.
      const tags: string[] = link.topic_tags ?? [];
      if (tags.length) {
        const { data: c } = await admin
          .from("contacts")
          .select("interests")
          .eq("id", link.contact_id)
          .maybeSingle();
        const merged = [...new Set([...(c?.interests ?? []), ...tags])];
        await admin.from("contacts").update({ interests: merged }).eq("id", link.contact_id);
      }
    }
  } catch (e) {
    console.error("[track] could not record click", e);
  }

  return Response.redirect(link.url, 302);
});
