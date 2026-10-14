create table public.staff_invites (
  email text primary key,
  role public.app_role not null,
  created_at timestamptz not null default now()
);
grant all on public.staff_invites to service_role;
alter table public.staff_invites enable row level security;

create or replace function public.list_staff()
returns table(user_id uuid, email text, role public.app_role, pending boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  return query
    select ur.user_id, u.email::text, ur.role, false from public.user_roles ur join auth.users u on u.id = ur.user_id where ur.role in ('admin','crew')
    union all
    select null::uuid, i.email, i.role, true from public.staff_invites i;
end $$;
grant execute on function public.list_staff() to authenticated;

create or replace function public.add_staff(_email text, _role public.app_role)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid; e text := lower(trim(_email));
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  if _role not in ('admin','crew') then raise exception 'Choose admin or crew'; end if;
  select id into uid from auth.users where lower(email) = e;
  if uid is null then
    insert into public.staff_invites(email, role) values (e, _role) on conflict (email) do update set role = excluded.role;
    return 'invited';
  end if;
  delete from public.user_roles where user_id = uid and role in ('admin','crew');
  insert into public.user_roles(user_id, role) values (uid, _role);
  return 'added';
end $$;
grant execute on function public.add_staff(text, public.app_role) to authenticated;

create or replace function public.remove_staff(_user uuid, _email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  if _user = auth.uid() then raise exception 'You cannot remove yourself'; end if;
  if _user is null then delete from public.staff_invites where email = lower(_email);
  else delete from public.user_roles where user_id = _user and role in ('admin','crew'); end if;
end $$;
grant execute on function public.remove_staff(uuid, text) to authenticated;

create or replace function public.apply_staff_invite()
returns trigger language plpgsql security definer set search_path = public as $$
declare i public.staff_invites;
begin
  select * into i from public.staff_invites where email = lower(new.email);
  if found then
    insert into public.user_roles(user_id, role) values (new.id, i.role) on conflict do nothing;
    delete from public.staff_invites where email = i.email;
  end if;
  return new;
exception when others then return new;
end $$;
create trigger on_auth_user_staff_invite after insert on auth.users for each row execute function public.apply_staff_invite();

-- Door self check-in
create table public.taping_door_codes (
  taping_id uuid primary key references public.tapings(id) on delete cascade,
  code text not null default encode(gen_random_bytes(9), 'hex')
);
grant all on public.taping_door_codes to service_role;
alter table public.taping_door_codes enable row level security;

create or replace function public.door_code(_taping uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Crew only'; end if;
  insert into public.taping_door_codes(taping_id) values (_taping) on conflict do nothing;
  select code into c from public.taping_door_codes where taping_id = _taping;
  return c;
end $$;
grant execute on function public.door_code(uuid) to authenticated;

create or replace function public.self_check_in(_taping uuid, _code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.reservations; t public.tapings;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if not exists (select 1 from public.taping_door_codes where taping_id = _taping and code = _code) then raise exception 'This door code is not valid'; end if;
  select * into t from public.tapings where id = _taping;
  if now() < t.starts_at - interval '3 hours' or now() > t.starts_at + interval '3 hours' then raise exception 'Self check-in opens 3 hours before the taping'; end if;
  select * into r from public.reservations where taping_id = _taping and user_id = auth.uid() and status <> 'cancelled' limit 1;
  if not found then raise exception 'No reservation found for this taping on your account'; end if;
  update public.reservations set status='checked_in', checked_in_at=coalesce(checked_in_at, now()) where id=r.id;
  return jsonb_build_object('name', r.full_name, 'seats', r.seats, 'theme', t.theme, 'already', r.checked_in_at is not null);
end $$;
grant execute on function public.self_check_in(uuid, text) to authenticated;

-- Post-show feedback
create table public.taping_feedback (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  taping_id uuid not null references public.tapings(id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  testimonial_ok boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.taping_feedback to authenticated;
grant all on public.taping_feedback to service_role;
alter table public.taping_feedback enable row level security;
create policy "own or staff read feedback" on public.taping_feedback for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "attendee leaves feedback" on public.taping_feedback for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.reservations r join public.tapings t on t.id = r.taping_id
    where r.id = reservation_id and r.user_id = auth.uid() and r.taping_id = taping_feedback.taping_id and t.starts_at < now()));
create policy "attendee edits feedback" on public.taping_feedback for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Prayer & testimony inbox
create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'prayer' check (kind in ('prayer','testimony')),
  name text,
  email text,
  body text not null check (length(body) between 1 and 4000),
  share_on_air boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
grant insert on public.prayer_requests to anon, authenticated;
grant select, update, delete on public.prayer_requests to authenticated;
grant all on public.prayer_requests to service_role;
alter table public.prayer_requests enable row level security;
create policy "anyone submits prayer" on public.prayer_requests for insert to anon, authenticated with check (status = 'new');
create policy "staff read prayer" on public.prayer_requests for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update prayer" on public.prayer_requests for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff delete prayer" on public.prayer_requests for delete to authenticated using (public.is_staff(auth.uid()));