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

    const { data: row, error } = await supabaseAdmin
      .from(data.table)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !row) {
      console.error("[inquiry] row not found for notification", data.table, error);
      return { sent: false };
    }
    const record = row as Record<string, unknown>;
    if (record["notified_at"]) return { sent: false };

    const { sendInquiryNotification } = await import("./email.server");
    await sendInquiryNotification(data.table, record);

    await supabaseAdmin
      .from(data.table)
      .update({ notified_at: new Date().toISOString() })
      .eq("id", data.id);

    return { sent: true };
  });
