import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** "Invite top N to early access".
 *
 *  This has to run server-side: the invite emails need the Resend key, and the
 *  caller's admin role has to be checked against the database rather than
 *  trusted from the browser. requireSupabaseAuth verifies the bearer token and
 *  hands back a client scoped to that user, so the role lookup runs under RLS
 *  as them. */
export const inviteTopWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { count: number }) =>
    z.object({ count: z.number().int().min(1).max(5000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as {
      supabase: { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
      userId: string;
    };

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) throw new Error("Admins only.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invited, error } = await supabaseAdmin.rpc("invite_top_waitlist", {
      p_count: data.count,
    });
    if (error) {
      console.error("[waitlist] invite failed", error);
      throw new Error("Could not invite anyone. Please try again.");
    }

    const rows = invited ?? [];
    const { sendInviteEmail } = await import("./email.server");

    // Sequential rather than parallel: providers rate-limit bursts, and a
    // partial send is harder to reason about than a slower complete one.
    let sent = 0;
    for (const row of rows) {
      try {
        await sendInviteEmail(row.email, row.first_name, row.list_position);
        sent++;
      } catch (e) {
        // Status is already 'invited'; losing an email must not roll that back.
        console.error("[waitlist] invite email failed for", row.email, e);
      }
    }

    return { invited: rows.length, emailed: sent };
  });
