// Fires from a Postgres trigger when an inquiry row is inserted, so the alert
// does not depend on the submitter's browser staying alive long enough to make
// a second request.
//
// Deployed to Supabase Edge Functions (Deno), not to Vercel.

import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "IHNM Show <no-reply@ihnmshow.com>";
const NOTIFY_TO = Deno.env.get("INQUIRY_NOTIFY_TO");
const WEBHOOK_SECRET = Deno.env.get("INQUIRY_WEBHOOK_SECRET");

const LABELS: Record<string, string> = {
  partner_inquiries: "sponsor inquiry",
  contact_messages: "message",
  rental_inquiries: "studio rental inquiry",
};

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

function body(label: string, row: Record<string, unknown>) {
  const fields: [string, unknown][] = [
    ["Name", row.name],
    ["Business", row.business ?? row.organization],
    ["Email", row.email],
    ["Phone", row.phone],
    ["Interest", row.interest],
    ["Topic", row.topic],
    ["Event type", row.event_type],
    ["Preferred date", row.preferred_date],
    ["Headcount", row.headcount],
    ["Message", row.message ?? row.details],
  ];
  const rows = fields
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#8a7f72;vertical-align:top;white-space:nowrap">${k}</td>` +
        `<td style="padding:6px 0;color:#2b2520">${esc(String(v))}</td></tr>`,
    )
    .join("");
  const email = row.email ? String(row.email) : "";
  const name = row.name ? String(row.name) : "there";

  return `
<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2520">
  <p style="font-family:Georgia,serif;font-size:28px;margin:0 0 4px">IHNM <em style="color:#b8893b">Show</em></p>
  <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8a7f72;margin:0 0 24px">Studio A, San Jose</p>
  <p style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">New ${label}</p>
  <table style="font-size:14px;line-height:21px;border-collapse:collapse">${rows}</table>
  ${email ? `<p style="margin:24px 0 0"><a href="mailto:${esc(email)}" style="background:#2b2520;color:#fdf8ef;padding:11px 20px;border-radius:999px;text-decoration:none">Reply to ${esc(name)}</a></p>` : ""}
  <p style="font-size:13px;color:#8a7f72;margin-top:22px">Also in the Crew Portal.</p>
</div>`;
}

Deno.serve(async (req) => {
  // The function is public by default; the trigger proves itself with a shared secret.
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  let payload: { table?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const table = payload.table ?? "";
  const record = payload.record ?? {};
  const id = record.id ? String(record.id) : "";
  if (!(table in LABELS) || !id) return new Response("ignored", { status: 200 });

  if (!RESEND_KEY || !NOTIFY_TO) {
    console.error("notify-inquiry: RESEND_API_KEY or INQUIRY_NOTIFY_TO not set");
    return new Response("not configured", { status: 200 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Claim the row before sending. The conditional update is atomic, so if the
  // browser-side path is racing this one, exactly one of them wins and only one
  // email goes out.
  const { data: claimed } = await admin
    .from(table)
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id)
    .is("notified_at", null)
    .select("*");

  if (!claimed || claimed.length === 0) return new Response("already notified", { status: 200 });

  const row = claimed[0] as Record<string, unknown>;
  const label = LABELS[table];
  const detail = String(row.interest ?? row.topic ?? row.event_type ?? "");
  const subject = `New ${label}${detail ? ` — ${detail}` : ""} from ${String(row.name ?? "someone")}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to: NOTIFY_TO, subject, html: body(label, row) }),
  });

  if (!res.ok) {
    // Hand the claim back so a retry can pick it up.
    await admin.from(table).update({ notified_at: null }).eq("id", id);
    console.error("notify-inquiry: resend rejected", res.status, await res.text());
    return new Response("send failed", { status: 500 });
  }

  return new Response("sent", { status: 200 });
});
