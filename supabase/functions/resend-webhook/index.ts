// Resend delivery events. A bounce or a complaint suppresses the address for
// both brands immediately: continuing to send to it damages the sending
// domain for everyone else.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (SECRET && req.headers.get("x-webhook-secret") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  let body: { type?: string; data?: { to?: string[] | string; email?: string } };
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const type = body.type ?? "";
  const raw = body.data?.to ?? body.data?.email ?? "";
  const email = Array.isArray(raw) ? raw[0] : raw;
  if (!email) return new Response("no address", { status: 200 });

  const reason = type.includes("bounced")
    ? "bounce"
    : type.includes("complained")
      ? "complaint"
      : null;

  if (!reason) return new Response("ignored", { status: 200 });

  const { error } = await admin.rpc("suppress_email", {
    _email: email,
    _reason: reason,
    _detail: type,
  });
  if (error) {
    console.error("[resend-webhook] suppress failed", error);
    return new Response("failed", { status: 500 });
  }
  return new Response("suppressed", { status: 200 });
});
