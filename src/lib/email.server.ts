// Transactional email. The newsletter itself lives on Substack, which has no
// per-person send API, so this stays dormant until a transactional provider is
// configured. Set RESEND_API_KEY and EMAIL_FROM to switch it on; without them
// every call is a logged no-op and signups still succeed.
import type { JoinResult } from "./waitlist";
import { referralUrl, SPOTS_PER_REFERRAL, FIRST_ACCESS_COUNT } from "./waitlist";

const FROM = process.env["EMAIL_FROM"] ?? "IHNM Show <hello@ihnmshow.com>";
const SITE = process.env["SITE_URL"] ?? "https://ihnmshow.com";

function configured(): string | null {
  return process.env["RESEND_API_KEY"] ?? null;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = configured();
  if (!key) {
    console.info(`[email] skipped "${subject}" to ${to} — no RESEND_API_KEY configured`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok)
      console.error(`[email] provider rejected "${subject}": ${res.status} ${await res.text()}`);
  } catch (err) {
    // A failed email must never fail the signup.
    console.error("[email] send threw", err);
  }
}

const shell = (body: string) => `
<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2b2520">
  <p style="font-family:Georgia,serif;font-size:28px;margin:0 0 4px">IHNM <em style="color:#b8893b">Show</em></p>
  <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8a7f72;margin:0 0 24px">Studio A, San Jose</p>
  ${body}
  <hr style="border:none;border-top:1px solid #e6ddd0;margin:28px 0 12px" />
  <p style="font-size:12px;color:#8a7f72">You're receiving this because you joined the IHNM Show waitlist.</p>
</div>`;

/** Confirmation when confirmation is required, welcome when it isn't. */
export async function sendWaitlistEmail(row: JoinResult): Promise<void> {
  if (row.already) return;

  if (!row.confirmed && row.confirm_token) {
    await send(
      row.email,
      "Confirm your spot — IHNM Show",
      shell(`
        <p>Hi ${escapeHtml(row.first_name)},</p>
        <p>One click and your spot is saved.</p>
        <p style="margin:24px 0">
          <a href="${SITE}/confirm/${row.confirm_token}"
             style="background:#2b2520;color:#fdf8ef;padding:12px 22px;border-radius:999px;text-decoration:none">
            Confirm your spot
          </a>
        </p>
        <p style="font-size:13px;color:#8a7f72">If the button doesn't work, paste this in your browser:<br />
          ${SITE}/confirm/${row.confirm_token}</p>`),
    );
    return;
  }

  await sendWelcomeEmail(row);
}

/** Sent once the spot is confirmed: position plus what the link is for. */
export async function sendWelcomeEmail(row: {
  email: string;
  first_name: string;
  position: number;
  referral_code: string;
}): Promise<void> {
  const link = referralUrl(row.referral_code, SITE);
  await send(
    row.email,
    `You're #${row.position} on the list — IHNM Show`,
    shell(`
      <p>Hi ${escapeHtml(row.first_name)},</p>
      <p style="font-family:Georgia,serif;font-size:24px;margin:16px 0">You're #${row.position} on the list.</p>
      <p><strong>Want to move up?</strong> Send the link below to friends. Every friend who joins
         through it moves you up ${SPOTS_PER_REFERRAL} spots, and the first ${FIRST_ACCESS_COUNT}
         people on the list get first access to tickets.</p>
      <p style="margin:20px 0">
        <a href="${link}" style="color:#b8893b;word-break:break-all">${link}</a></p>`),
  );
}

/** Used by "Invite top N to early access". */
export async function sendInviteEmail(
  to: string,
  firstName: string,
  position: number,
): Promise<void> {
  await send(
    to,
    "Your early access to IHNM Show tickets",
    shell(`
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>You're #${position} on the waitlist, and tickets are opening to you first.</p>
      <p style="margin:24px 0">
        <a href="${SITE}/tickets"
           style="background:#2b2520;color:#fdf8ef;padding:12px 22px;border-radius:999px;text-decoration:none">
          Claim your seat
        </a>
      </p>`),
  );
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

/** Where new-inquiry alerts go. */
const NOTIFY_TO = process.env["INQUIRY_NOTIFY_TO"] ?? null;

const INQUIRY_LABELS: Record<string, string> = {
  partner_inquiries: "sponsor inquiry",
  contact_messages: "message",
  rental_inquiries: "studio rental inquiry",
};

/** Alerts the team that something arrived, so inquiries aren't only visible to
 *  whoever happens to open the Crew Portal. */
export async function sendInquiryNotification(
  table: string,
  row: Record<string, unknown>,
): Promise<void> {
  if (!NOTIFY_TO) {
    console.info(`[email] skipped inquiry alert — no INQUIRY_NOTIFY_TO configured`);
    return;
  }

  const label = INQUIRY_LABELS[table] ?? "inquiry";
  const name = String(row["name"] ?? "Someone");
  const email = String(row["email"] ?? "");
  const detail = String(row["interest"] ?? row["topic"] ?? row["event_type"] ?? "");

  // Only show fields that have a value, so each inquiry type reads cleanly
  // without a template per table.
  const fields: [string, unknown][] = [
    ["Name", row["name"]],
    ["Business", row["business"] ?? row["organization"]],
    ["Email", row["email"]],
    ["Phone", row["phone"]],
    ["Interest", row["interest"]],
    ["Topic", row["topic"]],
    ["Event type", row["event_type"]],
    ["Preferred date", row["preferred_date"]],
    ["Headcount", row["headcount"]],
    ["Message", row["message"] ?? row["details"]],
  ];
  const rows = fields
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#8a7f72;vertical-align:top;white-space:nowrap">${k}</td>` +
        `<td style="padding:6px 0;color:#2b2520">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  await send(
    NOTIFY_TO,
    `New ${label}${detail ? ` — ${detail}` : ""} from ${name}`,
    shell(`
      <p style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">New ${label}</p>
      <table style="font-size:14px;line-height:21px;border-collapse:collapse">${rows}</table>
      ${email ? `<p style="margin:24px 0 0"><a href="mailto:${escapeHtml(email)}" style="background:#2b2520;color:#fdf8ef;padding:11px 20px;border-radius:999px;text-decoration:none">Reply to ${escapeHtml(name)}</a></p>` : ""}
      <p style="font-size:13px;color:#8a7f72;margin-top:22px">Also in the Crew Portal.</p>`),
  );
}

/** Two emails for one manuscript: a confirmation the writer can keep, and a
 *  notification so a submission is not only visible to whoever opens the
 *  database. */
export async function sendSubmissionEmails(row: Record<string, unknown>): Promise<void> {
  const name = String(row["name"] ?? "there");
  const title = String(row["book_title"] ?? "your manuscript");
  const email = String(row["email"] ?? "");
  const weeks = 8;

  if (email) {
    await send(
      email,
      "We have your manuscript — IHNM Publishing House",
      shell(`
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thank you for sending us <strong>${escapeHtml(title)}</strong>. It has arrived safely.</p>
        <p>We read everything that comes in, and you will hear from us within ${weeks} weeks
           whatever the answer. There is nothing you need to do in the meantime.</p>
        <p>One thing worth repeating: we never charge authors to publish. If anyone asks you for
           money on our behalf, it is not us.</p>
        <p style="margin-top:22px">— IHNM Publishing House</p>`),
    );
  }

  if (NOTIFY_TO) {
    const fields: [string, unknown][] = [
      ["Name", row["name"]],
      ["Email", row["email"]],
      ["Phone", row["phone"]],
      ["Title", row["book_title"]],
      ["Category", row["category"]],
      ["Words", row["word_count"]],
      ["Status", row["manuscript_status"]],
      ["Pitch", row["pitch"]],
      ["Platform", row["platform"]],
      ["File", row["file_path"] ? "attached in the manuscripts bucket" : "none"],
    ];
    const rows = fields
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 14px 6px 0;color:#8a7f72;vertical-align:top;white-space:nowrap">${k}</td>` +
          `<td style="padding:6px 0;color:#2b2520">${escapeHtml(String(v))}</td></tr>`,
      )
      .join("");
    await send(
      NOTIFY_TO,
      `New manuscript — ${title}`,
      shell(`
        <p style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">New manuscript</p>
        <table style="font-size:14px;line-height:21px;border-collapse:collapse">${rows}</table>`),
    );
  }
}
