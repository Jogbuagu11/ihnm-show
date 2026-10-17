-- Engine logic. Kept in SQL so the edge function only has to send mail and
-- call these; the rules stay next to the data and are testable without Deno.

-- Everything is scheduled and compared in Pacific time.
create or replace function public.pt_now() returns timestamptz
language sql stable as $$ select now() $$;

create or replace function public.pt_hour(_at timestamptz default now())
returns int language sql stable as $$
  select extract(hour from _at at time zone 'America/Los_Angeles')::int
$$;

create or replace function public.pt_date(_at timestamptz default now())
returns date language sql stable as $$
  select (_at at time zone 'America/Los_Angeles')::date
$$;

-- Condition steps read the timeline. config examples:
--   {"kind":"did_event","event":"ticket_reserved","within_days":30}
--   {"kind":"has_tag","tag":"church_group"}
--   {"kind":"has_interest","interest":"books"}
--   {"kind":"event_count_at_least","event":"checked_in","count":3}
create or replace function public.evaluate_condition(_contact uuid, _config jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  k text := _config->>'kind';
  ev text := _config->>'event';
  within int := nullif(_config->>'within_days','')::int;
  n int := coalesce(nullif(_config->>'count','')::int, 1);
begin
  if k = 'did_event' then
    return exists (
      select 1 from public.contact_events e
      where e.contact_id = _contact and e.type = ev
        and (within is null or e.occurred_at > now() - make_interval(days => within)));
  elsif k = 'not_did_event' then
    return not exists (
      select 1 from public.contact_events e
      where e.contact_id = _contact and e.type = ev
        and (within is null or e.occurred_at > now() - make_interval(days => within)));
  elsif k = 'event_count_at_least' then
    return (select count(*) from public.contact_events e
            where e.contact_id = _contact and e.type = ev) >= n;
  elsif k = 'has_tag' then
    return exists (select 1 from public.contacts c
                   where c.id = _contact and (_config->>'tag') = any(c.tags));
  elsif k = 'has_interest' then
    return exists (select 1 from public.contacts c
                   where c.id = _contact and (_config->>'interest') = any(c.interests));
  end if;
  -- An unknown condition takes the "no" branch rather than guessing.
  return false;
end $$;

-- Marketing is allowed only if consent and suppression allow it AND the
-- contact has not already had a marketing message today, Pacific.
create or replace function public.may_send_marketing(_contact uuid, _brand public.contact_brand)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_market(_contact, _brand)
     and not exists (
       select 1 from public.message_log m
       where m.contact_id = _contact
         and not m.transactional
         and public.pt_date(m.sent_at) = public.pt_date(now()))
$$;

-- Texts are never sent between 9pm and 8am Pacific.
create or replace function public.within_sms_hours(_at timestamptz default now())
returns boolean language sql stable as $$
  select public.pt_hour(_at) >= 8 and public.pt_hour(_at) < 21
$$;

-- Enter contacts into any enabled journey whose trigger this event matches.
create or replace function public.enter_journeys_for_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare j public.journeys; first_step uuid;
begin
  for j in
    select * from public.journeys
    where enabled and trigger_event = new.type
      and (trigger_filter = '{}'::jsonb or new.payload @> trigger_filter)
  loop
    -- allow_reentry=false relies on the partial unique index; the insert is
    -- simply skipped if a live run exists.
    select id into first_step from public.journey_steps
      where journey_id = j.id order by position limit 1;
    if first_step is null then continue; end if;

    begin
      insert into public.journey_runs (journey_id, contact_id, current_step_id, next_run_at)
      values (j.id, new.contact_id, first_step, now());
    exception when unique_violation then
      if j.allow_reentry then
        insert into public.journey_runs (journey_id, contact_id, current_step_id, next_run_at, status)
        values (j.id, new.contact_id, first_step, now(), 'active');
      end if;
    end;
  end loop;
  return new;
end $$;

create trigger on_contact_event_enter_journeys
  after insert on public.contact_events
  for each row execute function public.enter_journeys_for_event();

-- A goal event ends every live run of that journey for that contact.
create or replace function public.exit_journeys_for_goal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.journey_runs r
     set status = 'exited', completed_at = now(), exit_reason = 'goal:' || new.type
    from public.journeys j
   where r.journey_id = j.id
     and r.contact_id = new.contact_id
     and r.status = 'active'
     and j.goal_event = new.type;
  return new;
end $$;

create trigger on_contact_event_exit_journeys
  after insert on public.contact_events
  for each row execute function public.exit_journeys_for_goal();

-- Claim a batch of due runs. FOR UPDATE SKIP LOCKED means two overlapping
-- ticks never pick up the same run.
create or replace function public.claim_due_runs(_limit int default 50)
returns table (
  run_id uuid, contact_id uuid, journey_key text, brand public.contact_brand,
  step_id uuid, step_type public.journey_step_type, step_config jsonb,
  next_step_id uuid, alt_step_id uuid, email text, first_name text
) language plpgsql volatile security definer set search_path = public as $$
begin
  return query
  with due as (
    select r.id from public.journey_runs r
    where r.status = 'active' and r.next_run_at <= now()
    order by r.next_run_at
    limit _limit
    for update skip locked
  )
  select r.id, r.contact_id, j.key, j.brand,
         s.id, s.type, s.config, s.next_step_id, s.alt_step_id,
         c.email, c.first_name
  from public.journey_runs r
  join due on due.id = r.id
  join public.journeys j on j.id = r.journey_id
  join public.contacts c on c.id = r.contact_id
  left join public.journey_steps s on s.id = r.current_step_id;
end $$;

-- Record a step as done and move the run on. The insert into
-- journey_step_runs is the idempotency guard: a repeat is a no-op and the
-- caller is told not to send.
create or replace function public.advance_run(
  _run uuid, _step uuid, _next uuid, _run_at timestamptz default now(),
  _result jsonb default '{}'::jsonb
) returns boolean language plpgsql volatile security definer set search_path = public as $$
declare v_fresh boolean;
begin
  insert into public.journey_step_runs (run_id, step_id, result)
  values (_run, _step, _result)
  on conflict (run_id, step_id) do nothing;
  get diagnostics v_fresh = row_count;

  if _next is null then
    update public.journey_runs
       set status = 'completed', completed_at = now(), current_step_id = null
     where id = _run and status = 'active';
  else
    update public.journey_runs
       set current_step_id = _next, next_run_at = _run_at
     where id = _run and status = 'active';
  end if;

  return v_fresh;
end $$;

create or replace function public.fail_run(_run uuid, _reason text)
returns void language sql volatile security definer set search_path = public as $$
  update public.journey_runs
     set status = 'failed', completed_at = now(), exit_reason = _reason
   where id = _run and status = 'active'
$$;

create or replace function public.log_message(
  _contact uuid, _channel text, _template text,
  _run uuid default null, _step uuid default null, _transactional boolean default false
) returns void language sql volatile security definer set search_path = public as $$
  insert into public.message_log (contact_id, channel, template_key, journey_run_id, step_id, transactional)
  values (_contact, _channel, _template, _run, _step, _transactional)
$$;

-- Put a contact into a journey by hand, for the admin "add to journey" action.
create or replace function public.start_journey(_contact uuid, _journey_key text)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare j public.journeys; first_step uuid; v_id uuid;
begin
  select * into j from public.journeys where key = _journey_key;
  if not found then raise exception 'journey_not_found' using errcode = '22023'; end if;
  select id into first_step from public.journey_steps
    where journey_id = j.id order by position limit 1;
  if first_step is null then raise exception 'journey_has_no_steps' using errcode = '22023'; end if;

  insert into public.journey_runs (journey_id, contact_id, current_step_id, next_run_at)
  values (j.id, _contact, first_step, now())
  on conflict do nothing
  returning id into v_id;
  return v_id;
end $$;

grant execute on function public.evaluate_condition(uuid, jsonb) to authenticated;
grant execute on function public.may_send_marketing(uuid, public.contact_brand) to authenticated;
grant execute on function public.within_sms_hours(timestamptz) to authenticated;
grant execute on function public.start_journey(uuid, text) to authenticated;
