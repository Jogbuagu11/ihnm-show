-- Blocking someone who has been dismissed, from the audience, from
-- volunteering, or both.
--
-- Blocks carry an email as well as a user id, because the obvious way around a
-- block is to sign up again. A block on either matches.

create type public.block_scope as enum ('audience', 'volunteer', 'both');

create table public.person_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  scope public.block_scope not null default 'both',
  reason text not null,
  -- When the incident happened, which is not always when it was recorded.
  dismissed_on date,
  blocked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Lifting keeps the row, so the history survives.
  lifted_at timestamptz,
  lifted_by uuid references auth.users(id) on delete set null,
  lift_note text,
  check (user_id is not null or nullif(trim(coalesce(email, '')), '') is not null)
);
create index person_blocks_user_idx on public.person_blocks (user_id) where lifted_at is null;
create unique index person_blocks_email_idx on public.person_blocks (lower(email))
  where lifted_at is null and email is not null;

grant select on public.person_blocks to authenticated;
grant all on public.person_blocks to service_role;
alter table public.person_blocks enable row level security;

-- Staff see blocks so they know who is at the door; nobody else does. A
-- blocked person is told they are blocked when they try to book, not shown
-- the record.
create policy "staff read blocks" on public.person_blocks
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin manage blocks" on public.person_blocks
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.is_blocked(_user_id uuid, _scope public.block_scope)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.person_blocks b
    where b.lifted_at is null
      and (b.scope = _scope or b.scope = 'both')
      and (
        b.user_id = _user_id
        or (
          b.email is not null
          and lower(b.email) = lower((select u.email from auth.users u where u.id = _user_id))
        )
      )
  )
$$;

-- The reason is shown to the person, so it has to be written as something they
-- can be told.
create or replace function public.my_block_reason(_scope public.block_scope)
returns text language sql stable security definer set search_path = public as $$
  select b.reason from public.person_blocks b
  where b.lifted_at is null
    and (b.scope = _scope or b.scope = 'both')
    and (
      b.user_id = auth.uid()
      or (b.email is not null
          and lower(b.email) = lower((select u.email from auth.users u where u.id = auth.uid())))
    )
  order by b.created_at desc limit 1
$$;

create or replace function public.block_person(
  _user_id uuid,
  _email text,
  _scope public.block_scope,
  _reason text,
  _dismissed_on date default null
) returns uuid language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  if length(coalesce(trim(_reason), '')) < 3 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  if _user_id is null and nullif(trim(coalesce(_email, '')), '') is null then
    raise exception 'person_required' using errcode = '22023';
  end if;

  -- Lift any live block on the same person first, so re-blocking with a new
  -- reason does not trip the unique index or leave two live rows.
  update public.person_blocks set lifted_at = now(), lifted_by = auth.uid(),
         lift_note = 'superseded'
   where lifted_at is null
     and ((_user_id is not null and user_id = _user_id)
          or (email is not null and lower(email) = lower(trim(_email))));

  insert into public.person_blocks (user_id, email, scope, reason, dismissed_on, blocked_by)
  values (_user_id, nullif(trim(coalesce(_email, '')), ''), _scope, trim(_reason),
          _dismissed_on, auth.uid())
  returning id into v_id;

  -- A dismissed volunteer should stop holding future shifts immediately.
  if _scope in ('volunteer', 'both') and _user_id is not null then
    update public.volunteers set status = 'blocked' where user_id = _user_id;
    update public.shift_claims sc set status = 'released'
      from public.shifts s
     where sc.shift_id = s.id and sc.user_id = _user_id
       and sc.status <> 'released' and s.starts_at > now();
  end if;

  return v_id;
end $$;

create or replace function public.lift_block(_id uuid, _note text default null)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  update public.person_blocks
     set lifted_at = now(), lifted_by = auth.uid(),
         lift_note = nullif(trim(coalesce(_note, '')), '')
   where id = _id and lifted_at is null;
end $$;

grant execute on function public.is_blocked(uuid, public.block_scope) to authenticated;
grant execute on function public.my_block_reason(public.block_scope) to authenticated;
grant execute on function public.block_person(uuid, text, public.block_scope, text, date) to authenticated;
grant execute on function public.lift_block(uuid, text) to authenticated;
