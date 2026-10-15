import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { JoinResult } from "./waitlist";
import { WAITLIST_SOURCES } from "./waitlist";

// Public signup and confirmation run through the server because join_waitlist
// and confirm_waitlist are revoked from anon -- otherwise anyone could probe an
// email address to read back someone else's position.
//
// Admin tools are NOT here on purpose: they go straight from the browser with
// the admin's own JWT, and the RPCs check has_role themselves.

const trimmed = (max: number) => z.string().trim().max(max);

const joinSchema = z.object({
  first_name: trimmed(80).min(1, "First name is required"),
  last_name: trimmed(80).min(1, "Last name is required"),
  email: trimmed(255).email("Enter a valid email"),
  phone: trimmed(40).optional().nullable(),
  sms_opt_in: z.boolean().optional().default(false),
  zip: trimmed(12).optional().nullable(),
  source: z.enum(WAITLIST_SOURCES).optional().nullable(),
  church_group: z.boolean().optional().default(false),
  church_name: trimmed(120).optional().nullable(),
  ref: trimmed(120).optional().nullable(),
  utm_source: trimmed(120).optional().nullable(),
  utm_medium: trimmed(120).optional().nullable(),
  utm_campaign: trimmed(120).optional().nullable(),
  utm_term: trimmed(120).optional().nullable(),
  utm_content: trimmed(120).optional().nullable(),
});

export type JoinInput = z.input<typeof joinSchema>;

// The generated RPC types treat defaulted arguments as optional rather than
// nullable, so an absent value must be undefined: supabase-js then drops the
// key and Postgres applies the column default.
const blank = (v: string | null | undefined): string | undefined => {
  const s = v?.trim();
  return s ? s : undefined;
};

/** Spreads to nothing when the value is absent. */
const opt = <K extends string>(key: K, value: string | undefined) =>
  (value === undefined ? {} : { [key]: value }) as { [P in K]?: string };

export const joinWaitlist = createServerFn({ method: "POST" })
  .validator((data: JoinInput) => joinSchema.parse(data))
  .handler(async ({ data }): Promise<JoinResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // exactOptionalPropertyTypes forbids an explicit undefined for an optional
    // argument, so each nullable field is spread in only when it has a value.
    const { data: result, error } = await supabaseAdmin.rpc("join_waitlist", {
      p_first_name: data.first_name,
      p_last_name: data.last_name,
      p_email: data.email,
      p_sms_opt_in: data.sms_opt_in ?? false,
      p_church_group: data.church_group ?? false,
      ...opt("p_phone", blank(data.phone)),
      ...opt("p_zip", blank(data.zip)),
      ...opt("p_source", blank(data.source)),
      ...opt("p_church_name", blank(data.church_name)),
      ...opt("p_ref_code", blank(data.ref)),
      ...opt("p_utm_source", blank(data.utm_source)),
      ...opt("p_utm_medium", blank(data.utm_medium)),
      ...opt("p_utm_campaign", blank(data.utm_campaign)),
      ...opt("p_utm_term", blank(data.utm_term)),
      ...opt("p_utm_content", blank(data.utm_content)),
    });

    if (error) {
      // The RPC raises these for bad input; anything else is a real fault.
      if (error.message.includes("invalid_email")) throw new Error("Enter a valid email address.");
      if (error.message.includes("name_required"))
        throw new Error("Please enter your first and last name.");
      if (error.message.includes("field_too_long"))
        throw new Error("One of those fields is too long.");
      console.error("[waitlist] join failed", error);
      throw new Error("We couldn't add you to the list. Please try again.");
    }

    const row = result as unknown as JoinResult;

    // Only sends if a transactional provider is configured; today the
    // newsletter lives on Substack and confirmation is off by default.
    const { sendWaitlistEmail } = await import("./email.server");
    await sendWaitlistEmail(row);

    return row;
  });

export const confirmWaitlist = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => z.object({ token: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("confirm_waitlist", {
      p_token: data.token,
    });
    if (error) {
      if (error.message.includes("invalid_token"))
        throw new Error("That confirmation link isn't valid.");
      console.error("[waitlist] confirm failed", error);
      throw new Error("We couldn't confirm your spot. Please try again.");
    }
    return result as unknown as {
      position: number;
      referral_code: string;
      referral_count: number;
      first_name: string;
      confirmed: boolean;
    };
  });
