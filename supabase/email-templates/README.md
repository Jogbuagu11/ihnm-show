# Supabase auth email templates

Branded replacements for Supabase's default auth emails — ivory background,
gold accents, the IHNM wordmark and "Studio A, San Jose".

These are the **auth** emails only (sign-up, password reset, magic link…).
Waitlist emails are separate and live in `src/lib/email.server.ts`.

## Installing them

Supabase stores these in the project, not in this repo, so they have to be
pasted in once:

**Dashboard → Authentication → Emails → Templates**

Pick the template, paste the file's contents into the HTML box, set the
subject, Save.

| Supabase template | File | Subject line |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | Confirm your email — IHNM Show |
| Reset password | `reset-password.html` | Reset your IHNM Show password |
| Magic Link | `magic-link.html` | Your IHNM Show sign-in link |
| Invite user | `invite-user.html` | You're invited to IHNM Show |
| Change Email Address | `change-email.html` | Confirm your new email — IHNM Show |
| Reauthentication | `reauthentication.html` | Your IHNM Show verification code |

If you edit a template here, re-paste it — there is no sync.

## Why they're written this way

Email clients are not browsers. Every rule is inlined, the layout is nested
tables, and headings fall back to Georgia because Bodoni Moda is a webfont and
webfonts don't load in most mail clients. Avoid moving the styles into a
`<style>` block: Gmail strips it.

## Template variables

Supabase substitutes these on send:

- `{{ .ConfirmationURL }}` — the action link (every template except
  Reauthentication)
- `{{ .Token }}` — the 6-digit code (Reauthentication)
- `{{ .Email }}` — the recipient's current address
- `{{ .NewEmail }}` — the requested address (Change Email only)

## SMTP

These still send through Supabase's built-in SMTP until you set up your own,
and that one is rate-limited to a handful of emails per hour — fine for
testing, not for real traffic.

**Dashboard → Project Settings → Authentication → SMTP Settings**, then enter
Resend's SMTP details:

| Field | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your `re_…` API key |
| Sender email | an address on a domain verified in Resend |
| Sender name | `IHNM Show` |

Verify `ihnmshow.com` in Resend first (it hands you DKIM/SPF records to add to
DNS). Without that, confirmation emails land in spam or bounce.

Once SMTP is set, raise the rate limit under
**Authentication → Rate Limits → Emails per hour**, which stays low by default.
