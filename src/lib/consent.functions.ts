import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const brand = z.enum(["show", "publishing"]);

export type ConsentRow = { email: string; brand: "show" | "publishing"; subscribed: boolean };

/** What lists is the holder of this token on? The token is the only
 *  credential: an unsubscribe link has to work without signing in. */
export const getConsent = createServerFn({ method: "GET" })
  .validator((data: { token: string }) => z.object({ token: z.string().min(8) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("consent_by_token", {
      _token: data.token,
    });
    if (error) {
      console.error("[consent] lookup failed", error);
      throw new Error("We couldn't open that link.");
    }
    return (rows ?? []) as ConsentRow[];
  });

export const unsubscribe = createServerFn({ method: "POST" })
  .validator((data: { token: string; brand: "show" | "publishing" }) =>
    z.object({ token: z.string().min(8), brand }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("unsubscribe_by_token", {
      _token: data.token,
      _brand: data.brand,
      _reason: "email_link",
    });
    if (error) {
      console.error("[consent] unsubscribe failed", error);
      throw new Error("We couldn't update that. Please email us and we'll do it by hand.");
    }
    return { ok: true };
  });

export const resubscribe = createServerFn({ method: "POST" })
  .validator((data: { token: string; brand: "show" | "publishing" }) =>
    z.object({ token: z.string().min(8), brand }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("resubscribe_by_token", {
      _token: data.token,
      _brand: data.brand,
    });
    if (error) {
      console.error("[consent] resubscribe failed", error);
      throw new Error("We couldn't update that.");
    }
    return { ok: true };
  });
