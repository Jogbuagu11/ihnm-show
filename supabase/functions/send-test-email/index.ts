// Sends one template to the signed-in admin, rendered exactly as a real send
// would be: same layout, same footer, same merge pass. Only ever sends to the
// caller's own address, so this cannot be turned into a way to mail anyone.
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "IHNM Show <no-reply@ihnmshow.com>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.ihnmshow.com";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch,
  );

// The same sample values the admin preview uses, so what lands in the inbox
// matches what the editor showed.
const SAMPLE: Record<string, string> = {
  first_name: "Ada",
  email: "ada@example.com",
  site_url: SITE_URL,
  referral_url: `${SITE_URL}/?ref=ABC123`,
  unsubscribe_url: `${SITE_URL}/unsubscribe`,
  media_kit_url: `${SITE_URL}/media-kit.pdf`,
  keep_url: `${SITE_URL}/`,
  position: "42",
  amount: "$50",
  taping_date: "Saturday 6 March",
  shift_date: "Saturday 6 March, 5pm",
  role: "Door",
  episode_url: `${SITE_URL}/watch/episode-one`,
  topic: "the exile",
  book_title: "A Long Obedience",
};

const merge = (text: string) =>
  text.replace(/\{(\w+)\}/g, (_m, k: string) => esc(SAMPLE[k] ?? ""));

const BRAND = {
  show: { label: "Show", accent: "#b8893b", name: "IHNM Show" },
  publishing: { label: "Publishing House", accent: "#8a5a2b", name: "IHNM Publishing House" },
} as const;

function layout(bodyHtml: string, brand: "show" | "publishing", address: string | null) {
  const b = BRAND[brand] ?? BRAND.show;
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2520;line-height:1.55">
  <p style="font-family:Georgia,serif;font-size:28px;margin:0 0 20px">IHNM <em style="color:${b.accent}">${b.label}</em></p>
  <p style="background:#faf6ee;border:1px solid #e6ded0;border-radius:8px;padding:10px 14px;font-size:13px;margin:0 0 20px">
    This is a test send. Merge fields show sample values.
  </p>
  ${bodyHtml}
  <hr style="border:0;border-top:1px solid #e6ded0;margin:28px 0 14px">
  <p style="font-size:12px;color:#6b6257;margin:0">
    ${b.name}${address ? ` &middot; ${esc(address)}` : ""}<br>
    You are receiving this because you signed up at ${SITE_URL.replace(/^https?:\/\//, "")}.
    <a href="${SITE_URL}/unsubscribe" style="color:#6b6257">Unsubscribe</a>
  </p>
</div>
<style>a.btn{display:inline-block;background:#2b2520;color:#fdf8ef !important;padding:11px 20px;border-radius:999px;text-decoration:none}</style>`;
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer /, "");
  if (!jwt) return new Response("sign in first", { status: 401 });

  const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
  if (whoErr || !who?.user?.email) return new Response("sign in first", { status: 401 });

  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: who.user.id,
    _role: "admin",
  });
  if (!isAdmin) return new Response("admins only", { status: 403 });

  let body: { template?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const key = String(body.template ?? "");
  if (!key) return new Response("no template named", { status: 400 });

  const { data: tpl } = await admin
    .from("email_templates")
    .select("subject, html, brand")
    .eq("key", key)
    .maybeSingle();
  if (!tpl) return new Response("no such template", { status: 404 });

  const { data: settings } = await admin
    .from("site_settings")
    .select("org_mailing_address")
    .eq("id", 1)
    .maybeSingle();

  if (!RESEND_KEY) return new Response("no email provider configured", { status: 500 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      // Never an address from the request body.
      to: who.user.email,
      subject: `[Test] ${merge(tpl.subject)}`,
      html: layout(merge(tpl.html), tpl.brand, settings?.org_mailing_address ?? null),
    }),
  });
  if (!res.ok) {
    console.error("[send-test] resend rejected", res.status, await res.text());
    return new Response("the email provider rejected it", { status: 502 });
  }

  return new Response(JSON.stringify({ sent_to: who.user.email }), {
    headers: { "Content-Type": "application/json" },
  });
});
