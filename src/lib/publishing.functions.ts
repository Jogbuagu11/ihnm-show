import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Confirms to the writer and notifies us. Runs on the server because the row
 *  is read back with the service role — anon deliberately cannot read a
 *  submission, not even their own. */
export const notifySubmission = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Claim it, so a replayed call cannot send the writer a second email.
    const { data: claimed, error } = await supabaseAdmin
      .from("pub_submissions")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", data.id)
      .is("notified_at", null)
      .select("*");

    if (error || !claimed || claimed.length === 0) return { sent: false };

    const row = claimed[0] as Record<string, unknown>;
    const { sendSubmissionEmails } = await import("./email.server");
    try {
      await sendSubmissionEmails(row);
    } catch (e) {
      await supabaseAdmin.from("pub_submissions").update({ notified_at: null }).eq("id", data.id);
      console.error("[publishing] submission emails failed", e);
      return { sent: false };
    }
    return { sent: true };
  });
