-- Everything a marketing send legally needs, enforced in one place rather than
-- per template: an unsubscribe token, a postal address, URL-safe link tokens,
-- and the quiet sweep that makes the win-back journey able to fire at all.

-- gen_random_bytes with 'base64' yields '+' and '/', which break a URL path.
alter table public.tracked_links
  alter column token set default rtrim(translate(encode(gen_random_bytes(9), 'base64'), '+/', '-_'), '=');

-- One token per contact, not per brand: the brand travels in the link, and a
-- person holding their own token may unsubscribe from either of their lists.
alter table public.contacts
  add column if not exists unsub_token text
    default rtrim(translate(encode(gen_random_bytes(16), 'base64'), '+/', '-_'), '=');
update public.contacts set unsub_token =
  rtrim(translate(encode(gen_random_bytes(16), 'base64'), '+/', '-_'), '=') where unsub_token is null;
alter table public.contacts alter column unsub_token set not null;
create unique index if not exists contacts_unsub_token_key on public.contacts (unsub_token);

-- CAN-SPAM requires a physical mailing address in every marketing email.
alter table public.site_settings
  add column if not exists org_mailing_address text;

-- Anyone holding the token may unsubscribe; that is the point of the link.
create or replace function public.unsubscribe_by_token(
  _token text, _brand public.contact_brand default 'show', _reason text default 'email_link'
) returns table (email text, brand public.contact_brand)
language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid; v_email text;
begin
  select c.id, c.email into v_id, v_email
  from public.contacts c where c.unsub_token = _token;
  if v_id is null then return; end if;
  perform public.unsubscribe_contact(v_id, _brand, _reason);
  return query select v_email, _brand;
end $$;
grant execute on function public.unsubscribe_by_token(text, public.contact_brand, text)
  to anon, authenticated;

-- Which lists is this person still on? Drives the unsubscribe page.
create or replace function public.consent_by_token(_token text)
returns table (email text, brand public.contact_brand, subscribed boolean)
language sql stable security definer set search_path = public as $$
  select c.email, b.brand, coalesce(cc.subscribed, true)
  from public.contacts c
  cross join (select unnest(enum_range(null::public.contact_brand)) brand) b
  left join public.contact_consent cc on cc.contact_id = c.id and cc.brand = b.brand
  where c.unsub_token = _token
$$;
grant execute on function public.consent_by_token(text) to anon, authenticated;

-- The runner calls this to turn a plain URL into a /r/{token} redirect.
create or replace function public.make_tracked_link(
  _contact uuid, _url text, _campaign text default null, _topic_tags text[] default '{}'
) returns text language plpgsql volatile security definer set search_path = public as $$
declare v_token text;
begin
  insert into public.tracked_links (contact_id, url, campaign, topic_tags)
  values (_contact, _url, _campaign, coalesce(_topic_tags, '{}'))
  returning token into v_token;
  return v_token;
end $$;

-- Journey 14 triggers on inactivity, which is not something a user does, so
-- nothing can emit it from a form. A daily sweep emits it instead. The
-- 'went_quiet' event is logged at most once per 60-day stretch per contact.
create or replace function public.sweep_quiet_contacts(_days int default 60)
returns int language plpgsql volatile security definer set search_path = public as $$
declare v_count int;
begin
  with quiet as (
    select c.id
    from public.contacts c
    where c.created_at < now() - make_interval(days => _days)
      and not exists (
        select 1 from public.contact_events e
        where e.contact_id = c.id
          and e.type <> 'went_quiet'
          and e.occurred_at > now() - make_interval(days => _days))
      and not exists (
        select 1 from public.contact_events e
        where e.contact_id = c.id and e.type = 'went_quiet'
          and e.occurred_at > now() - make_interval(days => _days))
      and exists (
        select 1 from public.contact_consent cc
        where cc.contact_id = c.id and cc.subscribed)
  ), logged as (
    insert into public.contact_events (contact_id, type, payload)
    select q.id, 'went_quiet', jsonb_build_object('days', _days) from quiet q
    returning 1
  )
  select count(*)::int into v_count from logged;
  return v_count;
end $$;
