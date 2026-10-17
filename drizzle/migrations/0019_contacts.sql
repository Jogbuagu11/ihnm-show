-- Shared contact and event layer for both brands. The journeys engine is built
-- on top of this; nothing here depends on the engine existing.

create type public.contact_brand as enum ('show', 'publishing');
create type public.suppression_reason as enum ('bounce', 'complaint', 'manual');

-- One row per email across both sites.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  last_name text,
  phone text,
  sms_opt_in boolean not null default false,
  zip text,
  source text,
  tags text[] not null default '{}',
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index contacts_email_key on public.contacts (lower(email));
create index contacts_tags_idx on public.contacts using gin (tags);
create index contacts_interests_idx on public.contacts using gin (interests);

-- Consent is per brand: unsubscribing from the show must not unsubscribe from
-- the publishing list. Transactional mail ignores this table entirely.
create table public.contact_consent (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  brand public.contact_brand not null,
  subscribed boolean not null default true,
  unsubscribed_at timestamptz,
  reason text,
  updated_at timestamptz not null default now(),
  primary key (contact_id, brand)
);

-- The timeline. Append-only; nothing updates a past event.
create table public.contact_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index contact_events_contact_idx on public.contact_events (contact_id, occurred_at desc);
create index contact_events_type_idx on public.contact_events (type, occurred_at desc);

-- A bounce or complaint stops all marketing to that address, both brands, no
-- matter what consent says.
create table public.suppressions (
  email text primary key,
  reason public.suppression_reason not null,
  detail text,
  created_at timestamptz not null default now()
);

-- Every link in an email or text is a redirect, so clicks are measured without
-- relying on opens.
create table public.tracked_links (
  token text primary key default encode(gen_random_bytes(9), 'base64'),
  contact_id uuid references public.contacts(id) on delete set null,
  url text not null,
  campaign text,
  topic_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  token text not null references public.tracked_links(token) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  clicked_at timestamptz not null default now()
);
create index link_clicks_token_idx on public.link_clicks (token, clicked_at desc);

grant select, insert, update on public.contacts to authenticated;
grant select, insert, update on public.contact_consent to authenticated;
grant select on public.contact_events to authenticated;
grant select on public.suppressions to authenticated;
grant select on public.tracked_links, public.link_clicks to authenticated;
grant all on public.contacts, public.contact_consent, public.contact_events,
  public.suppressions, public.tracked_links, public.link_clicks to service_role;

alter table public.contacts enable row level security;
alter table public.contact_consent enable row level security;
alter table public.contact_events enable row level security;
alter table public.suppressions enable row level security;
alter table public.tracked_links enable row level security;
alter table public.link_clicks enable row level security;

-- Contact data is staff-only. Writes come from the server, not the browser.
create policy "staff read contacts" on public.contacts
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin manage contacts" on public.contacts
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "staff read consent" on public.contact_consent
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin manage consent" on public.contact_consent
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "staff read timeline" on public.contact_events
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read suppressions" on public.suppressions
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read links" on public.tracked_links
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff read clicks" on public.link_clicks
  for select to authenticated using (public.is_staff(auth.uid()));

-- Upsert by email, filling gaps without clobbering what is already known, and
-- defaulting consent for the brand that introduced them.
create or replace function public.upsert_contact(
  _email text,
  _brand public.contact_brand,
  _first_name text default null,
  _last_name text default null,
  _phone text default null,
  _sms_opt_in boolean default null,
  _zip text default null,
  _source text default null,
  _tags text[] default '{}',
  _interests text[] default '{}'
) returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
  v_email text := lower(trim(_email));
  v_id uuid;
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  insert into public.contacts (email, first_name, last_name, phone, sms_opt_in, zip, source, tags, interests)
  values (v_email, nullif(trim(coalesce(_first_name,'')),''), nullif(trim(coalesce(_last_name,'')),''),
          nullif(trim(coalesce(_phone,'')),''), coalesce(_sms_opt_in,false),
          nullif(trim(coalesce(_zip,'')),''), nullif(trim(coalesce(_source,'')),''),
          coalesce(_tags,'{}'), coalesce(_interests,'{}'))
  on conflict (lower(email)) do update set
    -- Only fill what is missing: a later form must not blank an earlier answer.
    first_name = coalesce(public.contacts.first_name, excluded.first_name),
    last_name  = coalesce(public.contacts.last_name,  excluded.last_name),
    phone      = coalesce(public.contacts.phone,      excluded.phone),
    zip        = coalesce(public.contacts.zip,        excluded.zip),
    source     = coalesce(public.contacts.source,     excluded.source),
    sms_opt_in = public.contacts.sms_opt_in or excluded.sms_opt_in,
    tags       = (select array(select distinct unnest(public.contacts.tags || excluded.tags))),
    interests  = (select array(select distinct unnest(public.contacts.interests || excluded.interests))),
    updated_at = now()
  returning id into v_id;

  insert into public.contact_consent (contact_id, brand)
  values (v_id, _brand)
  on conflict (contact_id, brand) do nothing;

  return v_id;
end $$;

create or replace function public.log_contact_event(
  _contact uuid, _type text, _payload jsonb default '{}'::jsonb
) returns uuid language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.contact_events (contact_id, type, payload)
  values (_contact, _type, coalesce(_payload, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end $$;

-- May we send marketing to this address, for this brand, right now?
create or replace function public.can_market(_contact uuid, _brand public.contact_brand)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.contacts c
    left join public.contact_consent cc on cc.contact_id = c.id and cc.brand = _brand
    where c.id = _contact
      and coalesce(cc.subscribed, true)
      and not exists (select 1 from public.suppressions s where lower(s.email) = lower(c.email))
  )
$$;

create or replace function public.unsubscribe_contact(
  _contact uuid, _brand public.contact_brand, _reason text default null
) returns void language plpgsql volatile security definer set search_path = public as $$
begin
  insert into public.contact_consent (contact_id, brand, subscribed, unsubscribed_at, reason)
  values (_contact, _brand, false, now(), _reason)
  on conflict (contact_id, brand) do update set
    subscribed = false, unsubscribed_at = now(), reason = excluded.reason, updated_at = now();
  perform public.log_contact_event(_contact, 'unsubscribed',
    jsonb_build_object('brand', _brand, 'reason', _reason));
end $$;

create or replace function public.suppress_email(
  _email text, _reason public.suppression_reason, _detail text default null
) returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.suppressions (email, reason, detail)
  values (lower(trim(_email)), _reason, _detail)
  on conflict (email) do update set reason = excluded.reason, detail = excluded.detail;
  select id into v_id from public.contacts where lower(email) = lower(trim(_email));
  if v_id is not null then
    perform public.log_contact_event(v_id, 'suppressed',
      jsonb_build_object('reason', _reason, 'detail', _detail));
  end if;
end $$;

grant execute on function public.upsert_contact(text, public.contact_brand, text, text, text, boolean, text, text, text[], text[]) to authenticated;
grant execute on function public.log_contact_event(uuid, text, jsonb) to authenticated;
grant execute on function public.can_market(uuid, public.contact_brand) to authenticated;
grant execute on function public.unsubscribe_contact(uuid, public.contact_brand, text) to authenticated;
grant execute on function public.suppress_email(text, public.suppression_reason, text) to authenticated;
