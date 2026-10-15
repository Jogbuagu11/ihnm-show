import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Only these tables may be notified on, so the endpoint can't be pointed at
// arbitrary tables.
const NOTIFIABLE = ["partner_inquiries", "contact_messages", "rental_inquiries"] as const;

const schema = z.object({
  table: z.enum(NOTIFIABLE),
  id: z.string().uuid(),
});

/** Emails the team about a newly submitted inquiry.
 *
 *  The row is re-read server-side rather than trusted from the caller, and
 *  notified_at makes it a no-op the second time, so a replayed call can't be
 *  used to send mail repeatedly. */
export const notifyInquiry = createServerFn({ method: "POST" })
  .validator((data: z.input<typeof schema>) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Claim the row and send only if the claim succeeded. The database trigger
    // calls the edge function for the same insert, so without an atomic claim
    // both paths could read notified_at as null and send twice. A conditional
    // UPDATE is atomic, so exactly one of them wins.
    const { data: claimed, error } = await supabaseAdmin
      .from(data.table)
      .update({ notified_at: new Date().toISOString() })
      .eq("id", data.id)
      .is("notified_at", null)
      .select("*");

    if (error) {
      console.error("[inquiry] claim failed", data.table, error);
      return { sent: false };
    }
    if (!claimed || claimed.length === 0) return { sent: false };

    const record = claimed[0] as Record<string, unknown>;
    try {
      const { sendInquiryNotification } = await import("./email.server");
      await sendInquiryNotification(data.table, record);
    } catch (e) {
      // Release the claim so the other path, or a retry, can still deliver it.
      await supabaseAdmin.from(data.table).update({ notified_at: null }).eq("id", data.id);
      console.error("[inquiry] send failed, claim released", e);
      return { sent: false };
    }

    return { sent: true };
  });
