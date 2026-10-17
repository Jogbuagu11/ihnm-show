-- Four gaps the seed journeys exposed.

-- 1. Event-relative waits ("two days before the taping") need the date that
-- caused the run. It was already on the triggering event; nothing was keeping
-- it. Without this a days_before_event wait silently resolves to no wait.
create or replace function public.enter_journeys_for_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare j public.journeys; first_step uuid;
begin
  for j in
    select * from public.journeys
    where enabled and trigger_event = new.type
      and (trigger_filter = '{}'::jsonb or new.payload @> trigger_filter)
  loop
    select id into first_step from public.journey_steps
      where journey_id = j.id order by position limit 1;
    if first_step is null then continue; end if;

    begin
      insert into public.journey_runs (journey_id, contact_id, current_step_id, next_run_at, context)
      values (j.id, new.contact_id, first_step, now(),
              jsonb_build_object('trigger', new.type, 'payload', coalesce(new.payload, '{}'::jsonb)));
    exception when unique_violation then
      if j.allow_reentry then
        insert into public.journey_runs (journey_id, contact_id, current_step_id, next_run_at, status, context)
        values (j.id, new.contact_id, first_step, now(), 'active',
                jsonb_build_object('trigger', new.type, 'payload', coalesce(new.payload, '{}'::jsonb)));
      end if;
    end;
  end loop;
  return new;
end $$;

-- 2. The runner needs that context, and merge fields, when it claims a run.
drop function if exists public.claim_due_runs(int);
create or replace function public.claim_due_runs(_limit int default 50)
returns table (
  run_id uuid, contact_id uuid, journey_key text, brand public.contact_brand,
  step_id uuid, step_type public.journey_step_type, step_config jsonb,
  next_step_id uuid, alt_step_id uuid, email text, first_name text,
  context jsonb, unsub_token text
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
         c.email, c.first_name, r.context, c.unsub_token
  from public.journey_runs r
  join due on due.id = r.id
  join public.journeys j on j.id = r.journey_id
  join public.contacts c on c.id = r.contact_id
  left join public.journey_steps s on s.id = r.current_step_id;
end $$;

-- 3. The win-back journey is specified to take a silent contact off the list.
-- That is an engine action, not an admin notification.
alter type public.journey_step_type add value if not exists 'unsubscribe';

-- 4. A journey whose email steps point at templates nobody has written yet
-- must not be switchable on: the runner would log "template not found" and
-- the contact would sit mid-journey having been told nothing.
create or replace function public.journey_readiness(_journey uuid)
returns table (missing_template text)
language sql stable security definer set search_path = public as $$
  select distinct s.config->>'template'
  from public.journey_steps s
  where s.journey_id = _journey
    and s.type = 'send_email'
    and not exists (
      select 1 from public.email_templates t where t.key = s.config->>'template')
$$;
grant execute on function public.journey_readiness(uuid) to authenticated;

create or replace function public.guard_journey_enable()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_missing text[];
begin
  if new.enabled and not coalesce(old.enabled, false) then
    select array_agg(missing_template) into v_missing
      from public.journey_readiness(new.id);
    if v_missing is not null then
      raise exception 'Cannot enable "%": missing email templates: %',
        new.name, array_to_string(v_missing, ', ');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_journey_enable_guard on public.journeys;
create trigger on_journey_enable_guard
  before update on public.journeys
  for each row execute function public.guard_journey_enable();
