// Advances journey runs. Called by pg_cron every 5 minutes.
//
// The engine rules live in SQL; this only sends mail and calls them. Every
// send is guarded by advance_run, which refuses a step that has already run —
// so a retry, an overlapping tick or a redeploy cannot send twice.
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "IHNM Show <no-reply@ihnmshow.com>";
const NOTIFY_TO = Deno.env.get("INQUIRY_NOTIFY_TO");
const SECRET = Deno.env.get("JOURNEY_RUNNER_SECRET");
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.ihnmshow.com";
const BATCH = 50;

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Claim = {
  run_id: string;
  contact_id: string;
  journey_key: string;
  brand: "show" | "publishing";
  step_id: string | null;
  step_type: string | null;
  step_config: Record<string, unknown>;
  next_step_id: string | null;
  alt_step_id: string | null;
  email: string;
  first_name: string | null;
  context: { trigger?: string; payload?: Record<string, unknown> } | null;
  unsub_token: string | null;
};

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch,
  );

/** {first_name} and friends. An absent value becomes a sensible word, never
 *  the literal placeholder. Values from the triggering event are available
 *  too, so {position} and {book_title} resolve without a second query. */
function merge(text: string, c: Claim, extra: Record<string, string> = {}) {
  const payload = c.context?.payload ?? {};
  const fromEvent: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && v !== undefined && typeof v !== "object") fromEvent[k] = String(v);
  }
  const code = fromEvent["referral_code"];
  const fields: Record<string, string> = {
    ...fromEvent,
    first_name: c.first_name ?? "friend",
    email: c.email,
    site_url: SITE_URL,
    media_kit_url: `${SITE_URL}/media-kit.pdf`,
    ...(code ? { referral_url: `${SITE_URL}/?ref=${encodeURIComponent(code)}` } : {}),
    ...(c.unsub_token
      ? {
          unsubscribe_url: `${SITE_URL}/unsubscribe?t=${c.unsub_token}&b=${c.brand}`,
          // The win-back "keep me" link needs no handler: it is rewritten to
          // a tracked redirect, and that click is the goal event that exits
          // the journey and leaves them subscribed.
          keep_url: `${SITE_URL}/`,
        }
      : {}),
    ...extra,
  };
  return text.replace(/\{(\w+)\}/g, (_m, k: string) => esc(fields[k] ?? ""));
}

const BRAND = {
  show: { name: "IHNM Show", accent: "#b8893b" },
  publishing: { name: "IHNM Publishing House", accent: "#8a5a2b" },
} as const;

/** Every marketing send goes through here, so no template can ship without
 *  an unsubscribe link and a postal address. */
async function layout(bodyHtml: string, c: Claim) {
  const b = BRAND[c.brand] ?? BRAND.show;
  const { data: settings } = await admin
    .from("site_settings")
    .select("org_mailing_address")
    .eq("id", 1)
    .maybeSingle();
  const address = settings?.org_mailing_address?.trim();
  const unsub = c.unsub_token
    ? `<a href="${SITE_URL}/unsubscribe?t=${c.unsub_token}&amp;b=${c.brand}" style="color:#6b6257">Unsubscribe</a>`
    : "";
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2520;line-height:1.55">
  <p style="font-family:Georgia,serif;font-size:28px;margin:0 0 20px">IHNM <em style="color:${b.accent}">${b.name === "IHNM Show" ? "Show" : "Publishing House"}</em></p>
  ${bodyHtml}
  <hr style="border:0;border-top:1px solid #e6ded0;margin:28px 0 14px">
  <p style="font-size:12px;color:#6b6257;margin:0">
    ${b.name}${address ? ` &middot; ${esc(address)}` : ""}<br>
    You are receiving this because you signed up at ${SITE_URL.replace(/^https?:\/\//, "")}. ${unsub}
  </p>
</div>
<style>a.btn{display:inline-block;background:#2b2520;color:#fdf8ef !important;padding:11px 20px;border-radius:999px;text-decoration:none}</style>`;
}

/** Rewrite every outbound link to /r/{token} so clicks are measurable, which
 *  is what the topic and win-back journeys branch on. Unsubscribe links are
 *  left alone: a tracked unsubscribe would look like engagement. */
async function trackLinks(html: string, c: Claim, campaign: string) {
  const urls = [
    ...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]!)),
  ].filter((u) => !u.includes("/unsubscribe"));
  let out = html;
  for (const url of urls) {
    const { data: token, error } = await admin.rpc("make_tracked_link", {
      _contact: c.contact_id,
      _url: url,
      _campaign: campaign,
    });
    if (error || !token) continue;
    out = out.replaceAll(`href="${url}"`, `href="${SITE_URL}/r/${token}"`);
  }
  return out;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) {
    console.info(`[journey] no RESEND_API_KEY; would have sent "${subject}" to ${to}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) {
    console.error("[journey] resend rejected", res.status, await res.text());
    return false;
  }
  return true;
}

/** When this step should next be looked at.
 *
 *  A wait is either relative to now (days/hours/minutes) or relative to the
 *  date carried by the event that started the run: a taping, a shift, a
 *  rental. If an event-relative wait has no date to anchor to, the step is
 *  skipped rather than firing immediately — "two days before the taping" with
 *  no taping date must not become "right now". */
function waitUntil(config: Record<string, unknown>, c: Claim): string | null {
  const before =
    Number(config["days_before_event"] ?? 0) * 24 + Number(config["hours_before_event"] ?? 0);
  if (before > 0) {
    const payload = c.context?.payload ?? {};
    const raw =
      payload["starts_at"] ?? payload["event_at"] ?? payload["date"] ?? payload["shift_at"];
    const at = raw ? new Date(String(raw)) : null;
    if (!at || Number.isNaN(at.getTime())) {
      console.warn(`[journey] ${c.journey_key}: event-relative wait with no date; skipping step`);
      return null;
    }
    const target = at.getTime() - before * 3600_000;
    // Already past: move on now rather than scheduling into the past.
    return new Date(Math.max(target, Date.now())).toISOString();
  }

  // until_event waits for an event that another part of the system will log;
  // re-check daily instead of guessing a duration.
  if (config["until_event"]) {
    return new Date(Date.now() + 24 * 3600_000).toISOString();
  }

  const days = Number(config["days"] ?? 0);
  const hours = Number(config["hours"] ?? 0);
  const minutes = Number(config["minutes"] ?? 0);
  const ms = ((days * 24 + hours) * 60 + minutes) * 60_000;
  return new Date(Date.now() + (ms || 0)).toISOString();
}

async function runStep(c: Claim): Promise<void> {
  const cfg = c.step_config ?? {};
  const now = new Date().toISOString();

  // A run whose step vanished (deleted in admin) is completed, not retried.
  if (!c.step_id || !c.step_type) {
    await admin.rpc("fail_run", { _run: c.run_id, _reason: "step_missing" });
    return;
  }

  switch (c.step_type) {
    case "wait": {
      const until = waitUntil(cfg, c);
      if (until === null) {
        // No anchor date: skip the wait rather than collapse it to zero.
        await admin.rpc("advance_run", {
          _run: c.run_id,
          _step: c.step_id,
          _next: c.next_step_id,
          _run_at: now,
        });
        return;
      }
      // An until_event wait holds the run on this step until the event lands.
      if (cfg["until_event"]) {
        const { data: happened } = await admin.rpc("evaluate_condition", {
          _contact: c.contact_id,
          _config: { kind: "did_event", event: String(cfg["until_event"]) },
        });
        if (!happened) {
          await admin.from("journey_runs").update({ next_run_at: until }).eq("id", c.run_id);
          return;
        }
      }
      await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: until,
      });
      return;
    }

    case "condition": {
      const { data: yes } = await admin.rpc("evaluate_condition", {
        _contact: c.contact_id,
        _config: cfg,
      });
      await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: yes ? c.next_step_id : c.alt_step_id,
        _run_at: now,
        _result: { branch: yes ? "yes" : "no" },
      });
      return;
    }

    case "send_email": {
      const { data: allowed } = await admin.rpc("may_send_marketing", {
        _contact: c.contact_id,
        _brand: c.brand,
      });
      if (!allowed) {
        // Not a failure: try again tomorrow rather than dropping the step.
        await admin
          .from("journey_runs")
          .update({ next_run_at: new Date(Date.now() + 6 * 3600_000).toISOString() })
          .eq("id", c.run_id);
        return;
      }

      // Claim before sending. If this is not fresh, another tick already sent
      // it and we must not send again.
      const { data: fresh } = await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: now,
      });
      if (!fresh) return;

      const key = String(cfg["template"] ?? "");
      const { data: tpl } = await admin
        .from("email_templates")
        .select("subject, html")
        .eq("key", key)
        .maybeSingle();
      if (!tpl) {
        console.error(`[journey] template "${key}" not found`);
        return;
      }

      const body = await trackLinks(merge(tpl.html, c), c, `journey:${c.journey_key}:${key}`);
      const ok = await sendEmail(c.email, merge(tpl.subject, c), await layout(body, c));
      if (ok) {
        await admin.rpc("log_message", {
          _contact: c.contact_id,
          _channel: "email",
          _template: key,
          _run: c.run_id,
          _step: c.step_id,
          _transactional: false,
        });
      }
      return;
    }

    case "send_sms": {
      // No SMS provider is connected. Skip rather than stall the run, and say
      // so once per step so it is visible in the logs.
      console.warn("[journey] send_sms skipped: no SMS provider configured");
      await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: now,
        _result: { skipped: "no_sms_provider" },
      });
      return;
    }

    case "add_tag":
    case "remove_tag": {
      const tag = String(cfg["tag"] ?? "");
      const { data: contact } = await admin
        .from("contacts")
        .select("tags")
        .eq("id", c.contact_id)
        .maybeSingle();
      const current: string[] = contact?.tags ?? [];
      const next =
        c.step_type === "add_tag"
          ? [...new Set([...current, tag])]
          : current.filter((t) => t !== tag);
      await admin.from("contacts").update({ tags: next }).eq("id", c.contact_id);
      await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: now,
      });
      return;
    }

    case "start_journey": {
      const { data: fresh } = await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: now,
      });
      if (fresh) {
        await admin.rpc("start_journey", {
          _contact: c.contact_id,
          _journey_key: String(cfg["journey"] ?? ""),
        });
      }
      return;
    }

    case "admin_task": {
      const { data: fresh } = await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: now,
      });
      if (fresh) {
        await admin.from("admin_tasks").insert({
          contact_id: c.contact_id,
          title: merge(String(cfg["title"] ?? "Follow up"), c),
          detail: merge(String(cfg["detail"] ?? ""), c),
        });
      }
      return;
    }

    case "unsubscribe": {
      const { data: fresh } = await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: now,
      });
      if (fresh) {
        await admin.rpc("unsubscribe_contact", {
          _contact: c.contact_id,
          _brand: c.brand,
          _reason: String(cfg["reason"] ?? "journey"),
        });
      }
      return;
    }

    case "notify_admin": {
      const { data: fresh } = await admin.rpc("advance_run", {
        _run: c.run_id,
        _step: c.step_id,
        _next: c.next_step_id,
        _run_at: now,
      });
      if (fresh && NOTIFY_TO) {
        await sendEmail(
          NOTIFY_TO,
          merge(String(cfg["subject"] ?? "Journey notification"), c),
          `<p>${merge(String(cfg["body"] ?? ""), c)}</p><p>Contact: ${esc(c.email)}</p>`,
        );
      }
      return;
    }

    default: {
      await admin.rpc("fail_run", { _run: c.run_id, _reason: `unknown_step:${c.step_type}` });
    }
  }
}

Deno.serve(async (req) => {
  if (SECRET && req.headers.get("x-runner-secret") !== SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const { data: claims, error } = await admin.rpc("claim_due_runs", { _limit: BATCH });
  if (error) {
    console.error("[journey] claim failed", error);
    return new Response("claim failed", { status: 500 });
  }

  const list = (claims ?? []) as Claim[];
  let done = 0;
  for (const claim of list) {
    try {
      await runStep(claim);
      done++;
    } catch (e) {
      console.error("[journey] step threw", claim.run_id, e);
      await admin.rpc("fail_run", { _run: claim.run_id, _reason: "exception" });
    }
  }

  return new Response(JSON.stringify({ claimed: list.length, advanced: done }), {
    headers: { "content-type": "application/json" },
  });
});
