# IHNM Show — setup

The app is built and verified. Three things need a human: run the SQL, set the
Vercel environment variables, and claim the admin account.

## 1. Create the database schema — ✅ DONE

Applied on 2026-10-14 to project `otdeqjknjkznruqpcjrn`. Verified live:

- 38 tables, 46 functions, 4 enums, RLS enabled on **every** table
- `site_settings` seeded, public `media` storage bucket created
- `list_position` confirmed `GENERATED ALWAYS`, first-admin trigger installed
- Full signup → referral → position flow exercised in a real browser against
  this database, then the test rows were deleted and the counter reset, so your
  first real signup is #1

`supabase/sql/apply-all.sql` is kept for reference and for rebuilding a fresh
environment. **Do not run it again on this project** — it is not idempotent.

## 2. Claim the admin account

A trigger makes **the first account to sign up** an admin. So:

1. Go to `/auth` → **Admin & Crew** tab → sign up with your email
2. You now have the `admin` role; the Crew Portal opens at `/crew`

Do this before sharing the site, or the first stranger to sign up becomes admin.

## 3. Vercel environment variables

Set these in **Project → Settings → Environment Variables** (all environments):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://otdeqjknjkznruqpcjrn.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_4FWXbT1roslfsPs1w4pa5w_Z3HGqSWK` |
| `VITE_SUPABASE_URL` | same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same as the publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | the `sb_secret_…` key — **required**, the waitlist form will not work without it |
| `SITE_URL` | `https://ihnmshow.com` |
| `VITE_GA_MEASUREMENT_ID` | your GA4 id (optional; analytics stay off without it) |

The build targets Vercel through nitro's `vercel` preset and emits
`.vercel/output`, so Vercel needs no framework override — just `npm run build`.

> The `sb_secret_…` key was pasted into a chat transcript during development.
> Rotating it in Supabase (Settings → API) and updating Vercel is cheap
> insurance.

## 4. Fill in content

Crew Portal → **Settings** tab holds everything the home page shows:

- Hero headline and subline
- **Ticket drop date** — leave blank and the countdown stays hidden
- SMS keyword and number — the number is blank, so the page currently reads
  "number coming soon"
- Substack URL — the newsletter button and footer icon appear once it's set
- Social URLs (YouTube, Instagram, TikTok, Facebook, Threads, Nextdoor) — each
  icon only renders once its URL exists, so there are never dead links
- Media kit PDF upload — until then the bundled placeholder is served

## 5. Optional: Google sign-in

Email/password works out of the box. "Continue with Google" now uses Supabase
directly (it used to go through Lovable's broker), so it needs the Google
provider enabled under **Authentication → Providers**, with
`https://otdeqjknjkznruqpcjrn.supabase.co/auth/v1/callback` as the redirect URI.

## Email: the Substack gap

Substack sends newsletters but has **no API for per-person transactional
mail**, so it cannot send a "Confirm your spot" link with a unique token.

The waitlist is therefore configured to **confirm instantly**:
`site_settings.require_email_confirm` is `false`, so a signup counts
immediately and a referral credits the referrer on signup.

The trade-off: a made-up email address still counts as a referral. With ~100
first-access spots that's a real if small incentive to game. The full
confirm-gated flow is already built and tested — add a transactional sender
(`RESEND_API_KEY` + `EMAIL_FROM`), flip **Require email confirmation** on in
Settings, and referrals immediately start crediting only after the friend
clicks their link.

## Local development

```sh
npm install
npm run dev          # http://localhost:8080
npm test             # 57 unit tests
npm run build        # produces .vercel/output
```

`.env` holds public values and is committed. `.env.local` holds the service role
key and is gitignored — never move secrets into `.env`.
