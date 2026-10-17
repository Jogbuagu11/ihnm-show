-- Two rooms per taping: 0-4 and 5-10, six places each.
--
-- The room follows from the child's age, so the parent never chooses one and
-- cannot put a three-year-old in the older room to find a free place.

alter table public.kids_rooms add column sort_order int not null default 0;

-- Every taping gets both rooms, so none is ever missing at the door.
create or replace function public.create_default_kids_rooms()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.kids_rooms (taping_id, name, capacity, min_age_years, max_age_years, sort_order)
  values
    (new.id, 'Little Ones (0-4)', 6, 0, 4, 1),
    (new.id, 'Kids (5-10)',       6, 5, 10, 2);
  return new;
end $$;

create trigger on_taping_created_kids_rooms
  after insert on public.tapings
  for each row execute function public.create_default_kids_rooms();

-- Backfill tapings that already exist.
insert into public.kids_rooms (taping_id, name, capacity, min_age_years, max_age_years, sort_order)
select t.id, 'Little Ones (0-4)', 6, 0, 4, 1 from public.tapings t
where not exists (select 1 from public.kids_rooms k where k.taping_id = t.id and k.min_age_years = 0);
insert into public.kids_rooms (taping_id, name, capacity, min_age_years, max_age_years, sort_order)
select t.id, 'Kids (5-10)', 6, 5, 10, 2 from public.tapings t
where not exists (select 1 from public.kids_rooms k where k.taping_id = t.id and k.min_age_years = 5);

-- Age ranges must not overlap within a taping, or a child could match two rooms.
create or replace function public.kids_room_for_age(_taping uuid, _age int)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.kids_rooms
  where taping_id = _taping and _age between min_age_years and max_age_years
  order by sort_order limit 1
$$;

-- What the booking form shows: both rooms with their remaining places.
create or replace function public.kids_rooms_for_taping(_taping uuid)
returns table (id uuid, name text, min_age_years int, max_age_years int, capacity int, places_left int)
language sql stable security definer set search_path = public as $$
  select k.id, k.name, k.min_age_years, k.max_age_years, k.capacity,
         public.kids_places_left(k.id)
  from public.kids_rooms k
  where k.taping_id = _taping
  order by k.sort_order
$$;

-- Takes the taping and the child's age; resolves the room itself. Replaces the
-- version that took a room id, so the choice cannot be made by the caller.
drop function if exists public.register_child(uuid, uuid, text, text, int, text, text, text, text);

create or replace function public.register_child(
  _taping uuid,
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
  v_room_id uuid;
  v_code text;
  v_id uuid;
begin
  if _age is null or _age < 0 then
    raise exception 'age_required' using errcode = '22023';
  end if;

  v_room_id := public.kids_room_for_age(_taping, _age);
  if v_room_id is null then
    raise exception 'no_room_for_age' using errcode = '22023';
  end if;

  -- Hold the room row before counting, so two parents taking the last place at
  -- the same moment cannot both succeed.
  select * into v_room from public.kids_rooms where id = v_room_id for update;

  select * into v_res from public.reservations where id = _reservation;
  if not found then raise exception 'reservation_not_found' using errcode = '22023'; end if;
  if v_res.taping_id <> _taping then
    raise exception 'wrong_taping' using errcode = '22023';
  end if;
  if v_res.user_id is distinct from auth.uid() and not public.is_staff(auth.uid()) then
    raise exception 'not_your_reservation' using errcode = '42501';
  end if;
  if v_res.status not in ('confirmed', 'checked_in') then
    raise exception 'reservation_not_confirmed' using errcode = '22023';
  end if;
  if length(coalesce(trim(_first_name), '')) = 0 then
    raise exception 'name_required' using errcode = '22023';
  end if;
  if length(coalesce(trim(_guardian_phone), '')) < 7 then
    raise exception 'guardian_phone_required' using errcode = '22023';
  end if;
  if public.kids_places_left(v_room_id) <= 0 then
    raise exception 'room_full' using errcode = '22023';
  end if;

  v_code := public.gen_release_code();
  insert into public.kids_registrations (
    room_id, reservation_id, child_first_name, child_last_name, age_years,
    allergies, notes, guardian_name, guardian_phone, release_code
  ) values (
    v_room_id, _reservation, trim(_first_name), nullif(trim(coalesce(_last_name, '')), ''), _age,
    nullif(trim(coalesce(_allergies, '')), ''), nullif(trim(coalesce(_notes, '')), ''),
    trim(_guardian_name), trim(_guardian_phone), v_code
  ) returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'room_id', v_room_id,
    'room_name', v_room.name,
    'release_code', v_code,
    'places_left', public.kids_places_left(v_room_id)
  );
end $$;

grant execute on function public.kids_room_for_age(uuid, int) to anon, authenticated;
grant execute on function public.kids_rooms_for_taping(uuid) to anon, authenticated;
grant execute on function public.register_child(uuid, uuid, text, text, int, text, text, text, text) to authenticated;
