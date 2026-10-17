-- Supervised childcare during a taping.
--
-- Separate from reservations.minor_names, which is for children sitting in the
-- audience on an adult's ticket: those take an audience seat, these do not.
-- Modelled as rooms with a capacity rather than a hardcoded 6, so a second
-- room is a row rather than a migration.

create table public.kids_rooms (
  id uuid primary key default gen_random_uuid(),
  taping_id uuid not null references public.tapings(id) on delete cascade,
  name text not null default 'Kids'' Room',
  capacity int not null default 6 check (capacity between 0 and 50),
  min_age_years int not null default 1,
  max_age_years int not null default 10,
  notes text,
  created_at timestamptz not null default now(),
  check (min_age_years <= max_age_years)
);
create index kids_rooms_taping_idx on public.kids_rooms (taping_id);

create table public.kids_registrations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.kids_rooms(id) on delete cascade,
  -- Every child is tied to an adult's reservation: that is who we release to.
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  child_first_name text not null,
  child_last_name text,
  age_years int not null check (age_years between 0 and 18),
  allergies text,
  notes text,
  guardian_name text not null,
  guardian_phone text not null,
  -- Printed on the child's tag and the guardian's slip; both must match at
  -- pick-up, so a child cannot be collected by the wrong adult.
  release_code text not null,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  released_to text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index kids_registrations_room_idx on public.kids_registrations (room_id);
create index kids_registrations_reservation_idx on public.kids_registrations (reservation_id);

grant select on public.kids_rooms to anon, authenticated;
grant select on public.kids_registrations to authenticated;
grant all on public.kids_rooms, public.kids_registrations to service_role;
alter table public.kids_rooms enable row level security;
alter table public.kids_registrations enable row level security;

-- Capacity is public so the booking form can say "2 places left".
create policy "rooms readable" on public.kids_rooms
  for select to anon, authenticated using (true);
create policy "admin manage rooms" on public.kids_rooms
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- A parent sees only their own children; crew see the whole list to run the room.
create policy "read own children" on public.kids_registrations
  for select to authenticated using (
    public.is_staff(auth.uid())
    or exists (select 1 from public.reservations r
               where r.id = reservation_id and r.user_id = auth.uid())
  );
create policy "staff manage registrations" on public.kids_registrations
  for all to authenticated using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- Places left, counting only live registrations.
create or replace function public.kids_places_left(_room uuid)
returns int language sql stable security definer set search_path = public as $$
  select greatest(
    0,
    (select capacity from public.kids_rooms where id = _room)
    - (select count(*)::int from public.kids_registrations
       where room_id = _room and cancelled_at is null)
  )
$$;

-- Unambiguous when read aloud at a noisy pick-up table.
create or replace function public.gen_release_code()
returns text language sql volatile as $$
  select string_agg(substr('ACDEFHJKLMNPRTUVWXY349', 1 + floor(random() * 22)::int, 1), '')
  from generate_series(1, 4)
$$;

-- Registering is a security-definer RPC so capacity is enforced in one atomic
-- place, the way seats are, rather than trusted to the browser.
create or replace function public.register_child(
  _room uuid,
  _reservation uuid,
  _first_name text,
  _last_name text,
  _age int,
  _guardian_name text,
  _guardian_phone text,
  _allergies text default null,
  _notes text default null
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_room public.kids_rooms;
  v_res public.reservations;
  v_code text;
  v_id uuid;
begin
  select * into v_room from public.kids_rooms where id = _room for update;
  if not found then raise exception 'room_not_found' using errcode = '22023'; end if;

  select * into v_res from public.reservations where id = _reservation;
  if not found then raise exception 'reservation_not_found' using errcode = '22023'; end if;
  if v_res.taping_id <> v_room.taping_id then
    raise exception 'wrong_taping' using errcode = '22023';
  end if;
  -- Only the booking adult or crew may add a child to that booking.
  if v_res.user_id is distinct from auth.uid() and not public.is_staff(auth.uid()) then
    raise exception 'not_your_reservation' using errcode = '42501';
  end if;
  if v_res.status not in ('confirmed', 'checked_in') then
    raise exception 'reservation_not_confirmed' using errcode = '22023';
  end if;

  if _age < v_room.min_age_years or _age > v_room.max_age_years then
    raise exception 'age_out_of_range' using errcode = '22023';
  end if;
  if length(coalesce(trim(_first_name), '')) = 0 then
    raise exception 'name_required' using errcode = '22023';
  end if;
  if length(coalesce(trim(_guardian_phone), '')) < 7 then
    raise exception 'guardian_phone_required' using errcode = '22023';
  end if;

  -- FOR UPDATE above holds the room row, so two parents booking the last place
  -- at the same moment cannot both succeed.
  if public.kids_places_left(_room) <= 0 then
    raise exception 'room_full' using errcode = '22023';
  end if;

  v_code := public.gen_release_code();
  insert into public.kids_registrations (
    room_id, reservation_id, child_first_name, child_last_name, age_years,
    allergies, notes, guardian_name, guardian_phone, release_code
  ) values (
    _room, _reservation, trim(_first_name), nullif(trim(coalesce(_last_name, '')), ''), _age,
    nullif(trim(coalesce(_allergies, '')), ''), nullif(trim(coalesce(_notes, '')), ''),
    trim(_guardian_name), trim(_guardian_phone), v_code
  ) returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'release_code', v_code,
    'places_left', public.kids_places_left(_room)
  );
end $$;

create or replace function public.cancel_child(_registration uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_owner uuid;
begin
  select r.user_id into v_owner
  from public.kids_registrations k join public.reservations r on r.id = k.reservation_id
  where k.id = _registration;
  if not found then raise exception 'not_found' using errcode = '22023'; end if;
  if v_owner is distinct from auth.uid() and not public.is_staff(auth.uid()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  update public.kids_registrations
    set cancelled_at = now() where id = _registration and cancelled_at is null;
end $$;

-- Crew only: the room register.
create or replace function public.kids_check_in(_registration uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'staff_only' using errcode = '42501';
  end if;
  update public.kids_registrations
    set checked_in_at = coalesce(checked_in_at, now())
    where id = _registration and cancelled_at is null;
end $$;

-- Release requires the code off the guardian's slip. Wrong code, no child.
create or replace function public.kids_check_out(_registration uuid, _code text, _released_to text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v public.kids_registrations;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'staff_only' using errcode = '42501';
  end if;
  select * into v from public.kids_registrations where id = _registration;
  if not found then raise exception 'not_found' using errcode = '22023'; end if;
  if v.checked_in_at is null then raise exception 'not_checked_in' using errcode = '22023'; end if;
  if upper(trim(coalesce(_code, ''))) <> v.release_code then
    raise exception 'bad_release_code' using errcode = '42501';
  end if;
  update public.kids_registrations
    set checked_out_at = now(), released_to = nullif(trim(coalesce(_released_to, '')), '')
    where id = _registration;
end $$;

grant execute on function public.kids_places_left(uuid) to anon, authenticated;
grant execute on function public.register_child(uuid, uuid, text, text, int, text, text, text, text) to authenticated;
grant execute on function public.cancel_child(uuid) to authenticated;
grant execute on function public.kids_check_in(uuid) to authenticated;
grant execute on function public.kids_check_out(uuid, text, text) to authenticated;
