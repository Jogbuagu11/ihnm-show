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
