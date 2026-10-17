-- Giving details, editable in admin. Online card giving needs Stripe, which
-- does not exist yet, so the page is built around the methods that work today.
alter table public.site_settings
  add column giving_blurb text,
  add column giving_zelle text,
  add column giving_check_payable_to text,
  add column giving_mailing_address text,
  -- Switched on once Stripe exists; until then the page says so rather than
  -- showing a button that cannot take a payment.
  add column giving_online_enabled boolean not null default false;
