-- Per-page visibility for the prelaunch period. Hiding a page keeps it off the
-- nav, the footer and the sitemap and shows the public a holding page, while
-- staff still see the real thing — so these can be worked on live instead of
-- being commented out and left to rot.
alter table public.site_settings
  add column show_watch   boolean not null default false,
  add column show_tickets boolean not null default false,
  add column show_shuttle boolean not null default false,
  add column show_live    boolean not null default false,
  add column show_submit  boolean not null default false,
  -- Studio hire is a real revenue line today, so it stays public by default.
  add column show_rent    boolean not null default true,
  add column show_serve   boolean not null default true,
  add column show_prayer  boolean not null default true;
