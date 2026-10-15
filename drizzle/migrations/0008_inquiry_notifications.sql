-- Inquiries previously landed in the database silently: nothing told anyone a
-- sponsor had filled the form in. notified_at makes the "email the team" step
-- idempotent, so a retry or a double-submit cannot send twice.
alter table public.partner_inquiries add column notified_at timestamptz;
alter table public.contact_messages  add column notified_at timestamptz;
alter table public.rental_inquiries  add column notified_at timestamptz;

-- Nothing public should be able to read or set these; the service role does it.
revoke update (notified_at) on public.partner_inquiries from anon, authenticated;
revoke update (notified_at) on public.contact_messages  from anon, authenticated;
revoke update (notified_at) on public.rental_inquiries  from anon, authenticated;
