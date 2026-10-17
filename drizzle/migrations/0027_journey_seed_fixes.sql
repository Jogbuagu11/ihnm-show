-- Two problems with the seed as applied.

-- 1. confirmWaitlist already sends a welcome carrying the position and the
-- referral link, so the journey's own welcome step was a second welcome to
-- the same person. The journey starts after that instead, and only on
-- confirmation: an unconfirmed address should not receive a drip.
create or replace function public.sync_waitlist_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_contact uuid;
begin
  if new.confirmed_at is null or old.confirmed_at is not null then
    return new;
  end if;
  select id into v_contact from public.contacts where lower(email) = lower(new.email);
  if v_contact is null then return new; end if;
  perform public.log_contact_event(v_contact, 'waitlist_confirmed',
    jsonb_build_object('position', new.list_position, 'referral_code', new.referral_code));
  return new;
end $$;

-- With require_email_confirm off, the row is inserted already confirmed and
-- no update ever fires, so the insert path has to emit it too.
create or replace function public.sync_waitlist_contact()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_contact uuid;
begin
  v_contact := public.upsert_contact(
    new.email, 'show', new.first_name, new.last_name, new.phone,
    new.sms_opt_in, new.zip, new.source,
    case when new.church_group then array['church_group'] else '{}' end,
    '{}'
  );
  perform public.log_contact_event(v_contact, 'waitlist_joined',
    jsonb_build_object('position', new.list_position, 'referral_code', new.referral_code,
                       'referred_by', new.referred_by, 'utm_source', new.utm_source));
  if new.confirmed_at is not null then
    perform public.log_contact_event(v_contact, 'waitlist_confirmed',
      jsonb_build_object('position', new.list_position, 'referral_code', new.referral_code));
  end if;
  if new.referred_by is not null then
    perform public.log_contact_event(
      public.upsert_contact(
        (select email from public.waitlist_signups w where w.id = new.referred_by),
        'show', null, null, null, null, null, null, '{}', '{}'),
      'referral_made', jsonb_build_object('referred_email', new.email));
  end if;
  return new;
end $$;

drop trigger if exists on_waitlist_confirmed_contact on public.waitlist_signups;
create trigger on_waitlist_confirmed_contact
  after update of confirmed_at on public.waitlist_signups
  for each row execute function public.sync_waitlist_confirmed();

update public.journeys set trigger_event = 'waitlist_confirmed'
  where key = 'waitlist_welcome';

-- Drop the duplicate welcome step and relink the graph around it.
do $$
declare v_j uuid; v_first uuid;
begin
  select id into v_j from public.journeys where key = 'waitlist_welcome';
  update public.journey_steps set next_step_id = null
    where journey_id = v_j and position = 1 and type = 'send_email';
  delete from public.journey_steps
    where journey_id = v_j and position = 1 and type = 'send_email';
  select id into v_first from public.journey_steps
    where journey_id = v_j order by position limit 1;
  update public.journey_runs set current_step_id = v_first
    where journey_id = v_j and status = 'active' and current_step_id is null;
end $$;

-- 2. The quiet sweep as written would have swept the entire pre-launch
-- waitlist: people who joined, were told the show starts in March 2027, and
-- have had nothing to click since. Asking them "still want to hear from us?"
-- and then unsubscribing them would empty the list. Inactivity only counts
-- against someone we have actually been mailing.
create or replace function public.sweep_quiet_contacts(_days int default 60)
returns int language plpgsql volatile security definer set search_path = public as $$
declare v_count int;
begin
  with quiet as (
    select c.id
    from public.contacts c
    where c.created_at < now() - make_interval(days => _days)
      -- At least three marketing sends, so silence means something.
      and (select count(*) from public.message_log m
           where m.contact_id = c.id and not m.transactional) >= 3
      -- And the most recent one is old enough that a reply was possible.
      and (select max(m.sent_at) from public.message_log m
           where m.contact_id = c.id and not m.transactional)
          < now() - interval '14 days'
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
