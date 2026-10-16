-- IHNM Show — complete database setup
-- Paste this whole file into the Supabase SQL editor and press Run.
-- Validated by replaying it into a clean PostgreSQL 18 database.
-- Safe to run once on an empty project; it is NOT idempotent, so do not re-run.

-- ===================================================================
-- 0000_migration.sql
-- ===================================================================

create type public.app_role as enum ('admin','crew');
create type public.ticket_type as enum ('general','vip','group');
create type public.episode_type as enum ('episode','sitdown','special');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- first account to sign up becomes admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.tapings (
  id uuid primary key default gen_random_uuid(),
  theme text not null,
  description text,
  starts_at timestamptz not null,
  guests text[] not null default '{}',
  capacity int not null default 20,
  vip_seats int not null default 4,
  vip_price_cents int not null default 2000,
  group_enabled boolean not null default true,
  shuttle_start time not null default '18:00',
  shuttle_end time not null default '18:45',
  shuttle_interval_min int not null default 15,
  shuttle_seats_per_loop int not null default 7,
  created_at timestamptz not null default now()
);
grant select on public.tapings to anon, authenticated;
grant insert, update, delete on public.tapings to authenticated;
grant all on public.tapings to service_role;
alter table public.tapings enable row level security;
create policy "tapings public read" on public.tapings for select to anon, authenticated using (true);
create policy "staff write tapings" on public.tapings for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  taping_id uuid not null references public.tapings(id) on delete cascade,
  user_id uuid not null,
  full_name text not null,
  email text not null,
  ticket_type public.ticket_type not null default 'general',
  seats int not null default 1,
  status text not null default 'confirmed',
  question text,
  filming_consent boolean not null,
  qr_code text not null default replace(gen_random_uuid()::text,'-',''),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update on public.reservations to authenticated;
grant all on public.reservations to service_role;
alter table public.reservations enable row level security;
create policy "own or staff read res" on public.reservations for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff update res" on public.reservations for update to authenticated using (public.is_staff(auth.uid()));

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  taping_id uuid not null references public.tapings(id) on delete cascade,
  user_id uuid not null,
  full_name text not null,
  email text not null,
  status text not null default 'waiting',
  offered_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, delete on public.waitlist to authenticated;
grant all on public.waitlist to service_role;
alter table public.waitlist enable row level security;
create policy "own or staff read wl" on public.waitlist for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own delete wl" on public.waitlist for delete to authenticated using (user_id = auth.uid());

create table public.group_requests (
  id uuid primary key default gen_random_uuid(),
  taping_id uuid not null references public.tapings(id) on delete cascade,
  user_id uuid not null,
  church_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  seats int not null check (seats between 5 and 10),
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.group_requests to authenticated;
grant all on public.group_requests to service_role;
alter table public.group_requests enable row level security;
create policy "own or staff read gr" on public.group_requests for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own insert gr" on public.group_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "staff update gr" on public.group_requests for update to authenticated using (public.is_staff(auth.uid()));

create table public.shuttle_bookings (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  taping_id uuid not null references public.tapings(id) on delete cascade,
  user_id uuid not null,
  loop_time text not null,
  direction text not null default 'both',
  seats int not null default 1,
  status text not null default 'booked',
  arrived_at timestamptz,
  running_late_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, delete on public.shuttle_bookings to authenticated;
grant all on public.shuttle_bookings to service_role;
alter table public.shuttle_bookings enable row level security;
create policy "own or staff read sb" on public.shuttle_bookings for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own delete sb" on public.shuttle_bookings for delete to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table public.shuttle_bookings;

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  kind text not null,
  name text not null,
  email text not null,
  content text not null,
  status text not null default 'pending',
  taping_id uuid references public.tapings(id) on delete set null,
  created_at timestamptz not null default now()
);
grant insert on public.submissions to anon, authenticated;
grant select, update, delete on public.submissions to authenticated;
grant all on public.submissions to service_role;
alter table public.submissions enable row level security;
create policy "anyone submit" on public.submissions for insert to anon, authenticated with check (status = 'pending' and length(content) <= 4000);
create policy "staff read sub" on public.submissions for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update sub" on public.submissions for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff delete sub" on public.submissions for delete to authenticated using (public.is_staff(auth.uid()));

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind public.episode_type not null default 'episode',
  description text,
  youtube_url text,
  guests text[] not null default '{}',
  tags text[] not null default '{}',
  aired_on date not null default current_date,
  thumbnail text,
  created_at timestamptz not null default now()
);
grant select on public.episodes to anon, authenticated;
grant insert, update, delete on public.episodes to authenticated;
grant all on public.episodes to service_role;
alter table public.episodes enable row level security;
create policy "episodes public read" on public.episodes for select to anon, authenticated using (true);
create policy "staff write episodes" on public.episodes for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_signups to anon, authenticated;
grant select on public.newsletter_signups to authenticated;
grant all on public.newsletter_signups to service_role;
alter table public.newsletter_signups enable row level security;
create policy "anyone signup" on public.newsletter_signups for insert to anon, authenticated with check (length(email) <= 255);
create policy "staff read nl" on public.newsletter_signups for select to authenticated using (public.is_staff(auth.uid()));

-- seat helpers
create or replace function public.seats_taken(_taping uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(seats),0)::int from public.reservations where taping_id = _taping and status in ('confirmed','checked_in')
$$;

create or replace function public.taping_availability()
returns table(taping_id uuid, seats_left int, vip_left int, waitlist_count int)
language sql stable security definer set search_path = public as $$
  select t.id,
    greatest(t.capacity - public.seats_taken(t.id), 0),
    greatest(t.vip_seats - coalesce((select sum(seats) from public.reservations r where r.taping_id=t.id and r.ticket_type='vip' and r.status in ('confirmed','checked_in')),0)::int, 0),
    (select count(*)::int from public.waitlist w where w.taping_id=t.id and w.status='waiting')
  from public.tapings t
$$;
grant execute on function public.taping_availability() to anon, authenticated;

create or replace function public.shuttle_availability(_taping uuid)
returns table(loop_time text, booked int)
language sql stable security definer set search_path = public as $$
  select loop_time, coalesce(sum(seats),0)::int from public.shuttle_bookings
  where taping_id = _taping and status <> 'cancelled' group by loop_time
$$;
grant execute on function public.shuttle_availability(uuid) to anon, authenticated;

-- reserve a general seat (or join waitlist when full)
create or replace function public.reserve_seat(_taping uuid, _name text, _email text, _question text, _consent boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.tapings; r public.reservations; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  if not _consent then raise exception 'Filming consent is required'; end if;
  if length(coalesce(_name,'')) < 1 or length(_name) > 100 then raise exception 'Name is required'; end if;
  if length(coalesce(_question,'')) > 2000 then raise exception 'Question is too long'; end if;
  select * into t from public.tapings where id = _taping for update;
  if not found then raise exception 'Taping not found'; end if;
  if t.starts_at < now() then raise exception 'This taping has already happened'; end if;
  if exists (select 1 from public.reservations where taping_id=_taping and user_id=uid and status in ('confirmed','checked_in')) then
    raise exception 'You already have a ticket for this taping';
  end if;
  if public.seats_taken(_taping) >= t.capacity then
    if not exists (select 1 from public.waitlist where taping_id=_taping and user_id=uid and status in ('waiting','offered')) then
      insert into public.waitlist(taping_id,user_id,full_name,email) values (_taping, uid, _name, _email);
    end if;
    return jsonb_build_object('status','waitlisted');
  end if;
  insert into public.reservations(taping_id,user_id,full_name,email,question,filming_consent)
  values (_taping, uid, _name, _email, nullif(_question,''), true) returning * into r;
  update public.waitlist set status='claimed' where taping_id=_taping and user_id=uid;
  if nullif(_question,'') is not null then
    insert into public.submissions(user_id,kind,name,email,content,taping_id) values (uid,'question',_name,_email,_question,_taping);
  end if;
  return jsonb_build_object('status','confirmed','id',r.id);
end $$;
grant execute on function public.reserve_seat(uuid,text,text,text,boolean) to authenticated;

-- offer open seats to the waitlist
create or replace function public.offer_open_seats(_taping uuid)
returns void language plpgsql security definer set search_path = public as $$
declare t public.tapings; open_seats int; outstanding int;
begin
  select * into t from public.tapings where id=_taping;
  open_seats := t.capacity - public.seats_taken(_taping);
  select count(*) into outstanding from public.waitlist where taping_id=_taping and status='offered';
  update public.waitlist set status='offered', offered_at=now()
  where id in (select id from public.waitlist where taping_id=_taping and status='waiting' order by created_at limit greatest(open_seats - outstanding,0));
end $$;

create or replace function public.cancel_reservation(_reservation uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.reservations;
begin
  select * into r from public.reservations where id=_reservation;
  if not found or (r.user_id <> auth.uid() and not public.is_staff(auth.uid())) then raise exception 'Not allowed'; end if;
  update public.reservations set status='cancelled' where id=_reservation;
  update public.shuttle_bookings set status='cancelled' where reservation_id=_reservation;
  perform public.offer_open_seats(r.taping_id);
end $$;
grant execute on function public.cancel_reservation(uuid) to authenticated;

create or replace function public.book_shuttle(_reservation uuid, _loop text, _direction text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.reservations; t public.tapings; used int;
begin
  select * into r from public.reservations where id=_reservation and user_id=auth.uid() and status='confirmed';
  if not found then raise exception 'Reservation not found'; end if;
  if _direction not in ('to','return','both') then raise exception 'Invalid direction'; end if;
  select * into t from public.tapings where id=r.taping_id;
  select coalesce(sum(seats),0) into used from public.shuttle_bookings where taping_id=r.taping_id and loop_time=_loop and status<>'cancelled' and reservation_id<>_reservation;
  if used + r.seats > t.shuttle_seats_per_loop then raise exception 'That shuttle loop is full'; end if;
  delete from public.shuttle_bookings where reservation_id=_reservation;
  insert into public.shuttle_bookings(reservation_id,taping_id,user_id,loop_time,direction,seats)
  values (_reservation, r.taping_id, auth.uid(), _loop, _direction, r.seats);
end $$;
grant execute on function public.book_shuttle(uuid,text,text) to authenticated;

create or replace function public.shuttle_signal(_booking uuid, _signal text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _signal = 'here' then
    update public.shuttle_bookings set arrived_at=now() where id=_booking and user_id=auth.uid();
  elsif _signal = 'late' then
    update public.shuttle_bookings set running_late_at=now() where id=_booking and user_id=auth.uid();
  end if;
end $$;
grant execute on function public.shuttle_signal(uuid,text) to authenticated;

create or replace function public.check_in(_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.reservations;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Not allowed'; end if;
  select * into r from public.reservations where qr_code=_code or id::text=_code;
  if not found then raise exception 'Ticket not found'; end if;
  if r.status = 'cancelled' then raise exception 'This ticket was cancelled'; end if;
  update public.reservations set status='checked_in', checked_in_at=coalesce(checked_in_at, now()) where id=r.id;
  return jsonb_build_object('name', r.full_name, 'seats', r.seats, 'type', r.ticket_type, 'already', r.checked_in_at is not null);
end $$;
grant execute on function public.check_in(text) to authenticated;

create or replace function public.decide_group_request(_req uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare g public.group_requests; t public.tapings;
begin
  if not public.is_staff(auth.uid()) then raise exception 'Not allowed'; end if;
  select * into g from public.group_requests where id=_req and status='pending';
  if not found then raise exception 'Request not found'; end if;
  if _approve then
    select * into t from public.tapings where id=g.taping_id;
    if public.seats_taken(g.taping_id) + g.seats > t.capacity then raise exception 'Not enough seats left'; end if;
    insert into public.reservations(taping_id,user_id,full_name,email,ticket_type,seats,filming_consent)
    values (g.taping_id, g.user_id, g.church_name || ' (' || g.contact_name || ')', g.email, 'group', g.seats, true);
    update public.group_requests set status='approved' where id=_req;
  else
    update public.group_requests set status='declined' where id=_req;
  end if;
end $$;
grant execute on function public.decide_group_request(uuid,boolean) to authenticated;

-- seed
insert into public.tapings(theme, description, starts_at, guests) values
('Kings, Prophets & Power', 'From the courts of ancient Israel to today''s ballot box: what Scripture says about leadership and accountability.', '2026-11-05 03:00:00+00', array['Dr. Miriam Hale','Pastor Daniel Okafor']),
('The Exile and the Refugee', 'Babylon, diaspora, and the modern migration headlines — a conversation about home and belonging.', '2026-11-19 03:00:00+00', array['Prof. Samuel Reyes','Grace Whitfield']),
('Advent: Light in Dark Times', 'A special holiday taping with worship, history of the Nativity, and stories of hope from our audience.', '2026-12-10 03:00:00+00', array['The IHNM Worship Team','Rev. Ada Mensah']);

insert into public.episodes(slug,title,kind,description,youtube_url,guests,tags,aired_on,thumbnail) values
('the-flood-and-the-forecast','The Flood and the Forecast','episode','Noah, ancient flood narratives, and how we talk about climate today.','https://www.youtube.com/embed/dQw4w9WgXcQ',array['Dr. Miriam Hale'],array['Genesis','Climate','Ancient Near East'],'2026-09-18','studio'),
('jubilee-and-debt','Jubilee and the Debt Question','episode','Leviticus 25 meets student loans and modern economics.','https://www.youtube.com/embed/dQw4w9WgXcQ',array['Prof. Samuel Reyes','Lena Park'],array['Economics','Leviticus','Justice'],'2026-09-04','audience'),
('sitdown-ada-mensah','Sit-Down: Rev. Ada Mensah','sitdown','A long-form conversation about faith, grief, and leading a church through crisis.','https://www.youtube.com/embed/dQw4w9WgXcQ',array['Rev. Ada Mensah'],array['Leadership','Grief','Church'],'2026-08-28','sitdown'),
('sitdown-daniel-okafor','Sit-Down: Pastor Daniel Okafor','sitdown','From Lagos to San Jose — on migration, calling, and the Book of Ruth.','https://www.youtube.com/embed/dQw4w9WgXcQ',array['Pastor Daniel Okafor'],array['Ruth','Migration'],'2026-08-14','sitdown'),
('special-dead-sea-scrolls','Special: The Dead Sea Scrolls Panel','special','Three scholars on what the Scrolls tell us — and what they don''t.','https://www.youtube.com/embed/dQw4w9WgXcQ',array['Dr. Miriam Hale','Prof. Samuel Reyes','Dr. Noor Haddad'],array['Archaeology','History','Manuscripts'],'2026-07-30','panel'),
('worship-night-psalms','Psalms in the Headlines','episode','Lament, protest, and praise — the Psalms as a guide to reading the news.','https://www.youtube.com/embed/dQw4w9WgXcQ',array['The IHNM Worship Team','Grace Whitfield'],array['Psalms','Worship','Media'],'2026-07-17','worship');

-- ===================================================================
-- 0001_extras_releases_noshow_analytics.sql
-- ===================================================================
alter table public.tapings add column overbook_pct int not null default 30,
  add column sponsor_name text, add column sponsor_logo_url text, add column sponsor_url text;
alter table public.episodes add column sponsor_name text, add column sponsor_logo_url text, add column sponsor_url text;
alter table public.reservations add column minor_names text[] not null default '{}',
  add column accessible_seating boolean not null default false, add column no_show_at timestamptz;

create or replace function public.effective_capacity(_taping uuid) returns int language sql stable security definer set search_path to 'public' as $$
  select (capacity + ceil(capacity * overbook_pct / 100.0))::int from public.tapings where id=_taping $$;

create or replace function public.no_show_count(_user uuid) returns int language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from public.reservations where user_id=_user and status='no_show' $$;

create or replace function public.my_no_show_flag() returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.no_show_count(auth.uid()) >= 2 $$;

create or replace function public.taping_availability()
 returns table(taping_id uuid, seats_left integer, vip_left integer, waitlist_count integer)
 language sql stable security definer set search_path to 'public' as $$
  select t.id,
    greatest(public.effective_capacity(t.id) - public.seats_taken(t.id), 0),
    greatest(t.vip_seats - coalesce((select sum(seats) from public.reservations r where r.taping_id=t.id and r.ticket_type='vip' and r.status in ('confirmed','checked_in')),0)::int, 0),
    (select count(*)::int from public.waitlist w where w.taping_id=t.id and w.status='waiting')
  from public.tapings t $$;

create or replace function public.offer_open_seats(_taping uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare open_seats int; outstanding int;
begin
  open_seats := public.effective_capacity(_taping) - public.seats_taken(_taping);
  select count(*) into outstanding from public.waitlist where taping_id=_taping and status='offered';
  update public.waitlist set status='offered', offered_at=now()
  where id in (select id from public.waitlist where taping_id=_taping and status='waiting' order by created_at limit greatest(open_seats - outstanding,0));
end $$;

drop function public.reserve_seat(uuid, text, text, text, boolean);
create function public.reserve_seat(_taping uuid, _name text, _email text, _question text, _consent boolean, _minors text[] default '{}', _accessible boolean default false)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare t public.tapings; r public.reservations; uid uuid := auth.uid(); need int; m text[];
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  if not _consent then raise exception 'Filming consent is required'; end if;
  if length(coalesce(_name,'')) < 1 or length(_name) > 100 then raise exception 'Name is required'; end if;
  if length(coalesce(_question,'')) > 2000 then raise exception 'Question is too long'; end if;
  m := array(select trim(x) from unnest(coalesce(_minors,'{}')) x where trim(x) <> '');
  if cardinality(m) > 4 then raise exception 'Up to 4 minors per adult ticket'; end if;
  if exists (select 1 from unnest(m) x where length(x) > 100) then raise exception 'Name is too long'; end if;
  need := 1 + cardinality(m);
  select * into t from public.tapings where id = _taping for update;
  if not found then raise exception 'Taping not found'; end if;
  if t.starts_at < now() then raise exception 'This taping has already happened'; end if;
  if exists (select 1 from public.reservations where taping_id=_taping and user_id=uid and status in ('confirmed','checked_in')) then
    raise exception 'You already have a ticket for this taping'; end if;
  if public.no_show_count(uid) >= 2 and exists (
    select 1 from public.reservations rr join public.tapings tt on tt.id=rr.taping_id
    where rr.user_id=uid and rr.status='confirmed' and tt.starts_at > now()) then
    raise exception 'Because of missed tapings, you can hold one reservation at a time'; end if;
  if public.seats_taken(_taping) + need > public.effective_capacity(_taping) then
    if not exists (select 1 from public.waitlist where taping_id=_taping and user_id=uid and status in ('waiting','offered')) then
      insert into public.waitlist(taping_id,user_id,full_name,email) values (_taping, uid, _name, _email);
    end if;
    return jsonb_build_object('status','waitlisted');
  end if;
  insert into public.reservations(taping_id,user_id,full_name,email,question,filming_consent,seats,minor_names,accessible_seating)
  values (_taping, uid, _name, _email, nullif(_question,''), true, need, m, coalesce(_accessible,false)) returning * into r;
  update public.waitlist set status='claimed' where taping_id=_taping and user_id=uid;
  if nullif(_question,'') is not null then
    insert into public.submissions(user_id,kind,name,email,content,taping_id) values (uid,'question',_name,_email,_question,_taping);
  end if;
  return jsonb_build_object('status','confirmed','id',r.id);
end $$;

create or replace function public.mark_no_show(_reservation uuid, _undo boolean default false) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'Not allowed'; end if;
  if _undo then
    update public.reservations set status='confirmed', no_show_at=null where id=_reservation and status='no_show';
  else
    update public.reservations set status='no_show', no_show_at=now() where id=_reservation and status='confirmed';
  end if;
end $$;

create or replace function public.flagged_attendees(_taping uuid) returns table(user_id uuid, no_shows int) language sql stable security definer set search_path to 'public' as $$
  select r.user_id, public.no_show_count(r.user_id) from public.reservations r
  where r.taping_id=_taping and public.is_staff(auth.uid()) and public.no_show_count(r.user_id) >= 2 group by r.user_id $$;

-- Guest / worship team appearance releases
create table public.guest_releases (
  id uuid primary key default gen_random_uuid(),
  taping_id uuid not null references public.tapings(id) on delete cascade,
  name text not null, email text, role text not null default 'guest',
  token text not null unique default replace(gen_random_uuid()::text,'-',''),
  signed_at timestamptz, signature text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.guest_releases to authenticated;
grant all on public.guest_releases to service_role;
alter table public.guest_releases enable row level security;
create policy "staff manage releases" on public.guest_releases for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.get_release(_token text) returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('name', g.name, 'role', g.role, 'theme', t.theme, 'starts_at', t.starts_at, 'signed_at', g.signed_at)
  from public.guest_releases g join public.tapings t on t.id=g.taping_id where g.token=_token $$;
create or replace function public.sign_release(_token text, _signature text) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if length(trim(coalesce(_signature,''))) < 2 or length(_signature) > 120 then raise exception 'Please type your full name'; end if;
  update public.guest_releases set signed_at=now(), signature=trim(_signature) where token=_token and signed_at is null;
  if not found then raise exception 'This release link is invalid or already signed'; end if;
end $$;
grant execute on function public.get_release(text) to anon, authenticated;
grant execute on function public.sign_release(text, text) to anon, authenticated;

-- Analytics
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null, source text not null default 'direct', session_id text not null,
  created_at timestamptz not null default now()
);
grant insert on public.page_views to anon, authenticated;
grant select on public.page_views to authenticated;
grant all on public.page_views to service_role;
alter table public.page_views enable row level security;
create policy "anyone log view" on public.page_views for insert to anon, authenticated with check (length(path) <= 300 and length(source) <= 100 and length(session_id) <= 64);
create policy "admin read views" on public.page_views for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Site settings (hidden pages)
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  giving_enabled boolean not null default false,
  merch_enabled boolean not null default false
);
insert into public.site_settings(id) values (1);
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings public read" on public.site_settings for select to anon, authenticated using (true);
create policy "admin update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
-- ===================================================================
-- 0002_finance_portal.sql
-- ===================================================================
create table public.finance_settings (
  id int primary key default 1 check (id=1),
  fundraising_goal_cents int not null default 2100000,
  monthly_operating_cents int not null default 0
);
insert into public.finance_settings(id) values (1);

create table public.campaigns (id uuid primary key default gen_random_uuid(), name text not null, description text, goal_cents int not null default 0, active boolean not null default true, created_at timestamptz not null default now());
create table public.partners (id uuid primary key default gen_random_uuid(), user_id uuid, name text not null, email text, amount_cents int not null default 0, frequency text not null default 'monthly', start_date date not null default current_date, status text not null default 'active', campaign_id uuid references public.campaigns(id) on delete set null, created_at timestamptz not null default now());
create table public.sponsors (id uuid primary key default gen_random_uuid(), business text not null, contact text, email text, package text, price_cents int not null default 0, start_date date, end_date date, status text not null default 'active', agreement_path text, created_at timestamptz not null default now());
create table public.sponsor_deliverables (id uuid primary key default gen_random_uuid(), sponsor_id uuid not null references public.sponsors(id) on delete cascade, episode_id uuid references public.episodes(id) on delete set null, mention_made boolean not null default false, logo_shown boolean not null default false, clip_posted boolean not null default false, notes text, created_at timestamptz not null default now());
create table public.invoices (id uuid primary key default gen_random_uuid(), number text not null default ('INV-' || to_char(now(),'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,4)), client_name text not null, email text, kind text not null default 'sponsor', description text, amount_cents int not null default 0, issued_on date not null default current_date, due_on date not null default (current_date + 14), status text not null default 'draft', pay_url text, paid_on date, created_at timestamptz not null default now());
create table public.rentals (id uuid primary key default gen_random_uuid(), renter text not null, email text, phone text, starts_at timestamptz not null, ends_at timestamptz not null, rate_type text not null default 'hourly', rate_cents int not null default 0, deposit_cents int not null default 0, deposit_paid boolean not null default false, agreement_path text, invoice_id uuid references public.invoices(id) on delete set null, notes text, status text not null default 'booked', created_at timestamptz not null default now());
create table public.income (id uuid primary key default gen_random_uuid(), stream text not null, amount_cents int not null, received_on date not null default current_date, memo text, partner_id uuid references public.partners(id) on delete set null, sponsor_id uuid references public.sponsors(id) on delete set null, campaign_id uuid references public.campaigns(id) on delete set null, invoice_id uuid references public.invoices(id) on delete set null, created_at timestamptz not null default now());
create table public.expenses (id uuid primary key default gen_random_uuid(), category text not null, amount_cents int not null, spent_on date not null default current_date, vendor text, memo text, receipt_path text, created_at timestamptz not null default now());
create table public.budgets (category text primary key, monthly_cents int not null default 0);
insert into public.budgets(category) values ('rent'),('utilities'),('insurance'),('equipment'),('shuttle'),('hospitality'),('ads'),('software'),('supplies');

do $$ declare t text; begin
  foreach t in array array['finance_settings','campaigns','partners','sponsors','sponsor_deliverables','invoices','rentals','income','expenses','budgets'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin all %s" on public.%I for all to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))', t, t);
  end loop;
end $$;

create policy "giver reads own" on public.partners for select to authenticated using (user_id = auth.uid());

create or replace function public.cancel_my_giving(_partner uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.partners set status='canceled' where id=_partner and user_id=auth.uid() and status <> 'canceled';
  if not found then raise exception 'Gift not found'; end if;
end $$;

-- Private finance files bucket policies (bucket created separately)
create policy "admin read finance files" on storage.objects for select to authenticated using (bucket_id='finance' and public.has_role(auth.uid(),'admin'));
create policy "admin write finance files" on storage.objects for insert to authenticated with check (bucket_id='finance' and public.has_role(auth.uid(),'admin'));
create policy "admin delete finance files" on storage.objects for delete to authenticated using (bucket_id='finance' and public.has_role(auth.uid(),'admin'));
-- ===================================================================
-- 0003_giver_email_match.sql
-- ===================================================================
create policy "giver reads own by email" on public.partners for select to authenticated using (email is not null and lower(email) = lower(auth.jwt()->>'email'));
create or replace function public.cancel_my_giving(_partner uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.partners set status='canceled'
  where id=_partner and status <> 'canceled'
    and (user_id = auth.uid() or (email is not null and lower(email) = lower(auth.jwt()->>'email')));
  if not found then raise exception 'Gift not found'; end if;
end $$;
-- ===================================================================
-- 0004_studio_rentals.sql
-- ===================================================================
create table public.rental_settings (
  id int primary key default 1 check (id = 1),
  podcast_hourly_cents int not null default 6000,
  package_hourly_cents int not null default 12000,
  half_day_cents int not null default 30000,
  full_day_cents int not null default 50000,
  operator_hourly_cents int not null default 4000,
  edited_video_cents int not null default 15000,
  shuttle_cents int not null default 5000,
  setup_hourly_cents int not null default 3000,
  deposit_pct int not null default 50,
  security_deposit_cents int not null default 15000,
  max_capacity int not null default 30,
  pack_hours int not null default 10,
  pack_discount_pct int not null default 10
);
insert into public.rental_settings(id) values (1);
grant select on public.rental_settings to anon, authenticated;
grant update on public.rental_settings to authenticated;
grant all on public.rental_settings to service_role;
alter table public.rental_settings enable row level security;
create policy "anyone reads rental settings" on public.rental_settings for select to anon, authenticated using (true);
create policy "admin updates rental settings" on public.rental_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

alter table public.rentals
  add column user_id uuid,
  add column rental_type text not null default 'podcast',
  add column headcount int not null default 1,
  add column addons jsonb not null default '{}'::jsonb,
  add column quote_cents int not null default 0,
  add column security_deposit_cents int not null default 0,
  add column security_status text not null default 'held',
  add column security_note text,
  add column security_photo_path text,
  add column agreement_name text,
  add column agreement_signed_at timestamptz,
  add column balance_due_on date,
  add column balance_paid boolean not null default false,
  add column pack_hours_used numeric not null default 0,
  add column refund_pct int;
create policy "renter reads own rentals" on public.rentals for select to authenticated using (user_id = auth.uid());
create policy "renter reads own invoices" on public.invoices for select to authenticated using (exists (select 1 from public.rentals r where r.invoice_id = invoices.id and r.user_id = auth.uid()));

create table public.rental_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text not null,
  phone text,
  event_type text not null,
  preferred_date date,
  headcount int not null default 1,
  details text not null,
  status text not null default 'new',
  quote_cents int,
  pay_url text,
  admin_note text,
  created_at timestamptz not null default now()
);
grant insert on public.rental_inquiries to anon;
grant select, insert, update, delete on public.rental_inquiries to authenticated;
grant all on public.rental_inquiries to service_role;
alter table public.rental_inquiries enable row level security;
create policy "anyone sends inquiry" on public.rental_inquiries for insert to anon, authenticated
  with check (status = 'new' and quote_cents is null and pay_url is null and admin_note is null and (user_id is null or user_id = auth.uid())
    and length(name) between 1 and 100 and length(email) between 3 and 255 and length(details) between 1 and 3000);
create policy "owner reads inquiry" on public.rental_inquiries for select to authenticated using (user_id = auth.uid());
create policy "admin all inquiries" on public.rental_inquiries for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.hour_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  email text not null,
  hours numeric not null,
  hours_used numeric not null default 0,
  price_cents int not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.hour_packs to authenticated;
grant all on public.hour_packs to service_role;
alter table public.hour_packs enable row level security;
create policy "owner reads packs" on public.hour_packs for select to authenticated using (user_id = auth.uid());
create policy "admin all packs" on public.hour_packs for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Busy times (no renter details): rentals plus whole taping days (Pacific)
create or replace function public.studio_busy(_from date, _to date)
returns table(starts_at timestamptz, ends_at timestamptz, kind text)
language sql stable security definer set search_path to 'public' as $$
  select r.starts_at, r.ends_at, 'rental' from public.rentals r
   where r.status <> 'canceled' and r.ends_at >= (_from::timestamp at time zone 'America/Los_Angeles') and r.starts_at < ((_to + 1)::timestamp at time zone 'America/Los_Angeles')
  union all
  select ((t.starts_at at time zone 'America/Los_Angeles')::date::timestamp at time zone 'America/Los_Angeles'),
         (((t.starts_at at time zone 'America/Los_Angeles')::date + 1)::timestamp at time zone 'America/Los_Angeles'), 'taping'
   from public.tapings t where (t.starts_at at time zone 'America/Los_Angeles')::date between _from and _to
$$;

create or replace function public.rental_price(_type text, _start timestamptz, _end timestamptz, _addons jsonb, _pack_hours numeric default 0)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare s public.rental_settings; h numeric; base int; extras int := 0; setup int; covered numeric; total int;
begin
  select * into s from public.rental_settings where id=1;
  h := extract(epoch from (_end - _start)) / 3600.0;
  if h <= 0 then raise exception 'End time must be after start time'; end if;
  if _type = 'podcast' then
    if h < 2 then raise exception 'Recording rentals have a 2-hour minimum'; end if;
    covered := least(greatest(coalesce(_pack_hours,0),0), h);
    base := round((h - covered) * s.podcast_hourly_cents);
  elsif _type = 'package' then
    if h < 2 then raise exception 'Podcast packages have a 2-hour minimum'; end if;
    covered := 0; base := round(h * s.package_hourly_cents);
  elsif _type = 'half_day' then
    if h > 4 then raise exception 'A half day is up to 4 hours'; end if;
    covered := 0; base := s.half_day_cents;
  elsif _type = 'full_day' then
    if h > 8 then raise exception 'A full day is up to 8 hours'; end if;
    covered := 0; base := s.full_day_cents;
  else raise exception 'Unknown rental type'; end if;
  if coalesce((_addons->>'operator')::boolean,false) then extras := extras + round(h * s.operator_hourly_cents); end if;
  if coalesce((_addons->>'edited_video')::boolean,false) then extras := extras + s.edited_video_cents; end if;
  if coalesce((_addons->>'shuttle')::boolean,false) then extras := extras + s.shuttle_cents; end if;
  setup := least(greatest(coalesce((_addons->>'setup_hours')::int,0),0),4);
  extras := extras + setup * s.setup_hourly_cents;
  total := base + extras;
  return jsonb_build_object('hours', h, 'base', base, 'extras', extras, 'total', total, 'pack_hours', covered,
    'deposit', round(total * s.deposit_pct / 100.0)::int, 'security', s.security_deposit_cents);
end $$;

create or replace function public.book_rental(_type text, _start timestamptz, _end timestamptz, _headcount int, _addons jsonb,
  _name text, _email text, _phone text, _signature text, _use_pack boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare uid uuid := auth.uid(); s public.rental_settings; q jsonb; avail numeric := 0; used numeric; inv uuid; rid uuid;
  setup int; blk_start timestamptz; p record; left_h numeric; take numeric;
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  select * into s from public.rental_settings where id=1;
  if length(coalesce(trim(_name),'')) < 1 or length(_name) > 100 then raise exception 'Name is required'; end if;
  if length(coalesce(_email,'')) < 3 or length(_email) > 255 then raise exception 'Email is required'; end if;
  if length(trim(coalesce(_signature,''))) < 2 or length(_signature) > 120 then raise exception 'Please type your full name to sign the agreement'; end if;
  if _headcount < 1 or _headcount > s.max_capacity then raise exception 'Studio A holds up to % people, including staff', s.max_capacity; end if;
  if _start < now() + interval '24 hours' then raise exception 'Bookings must start at least 24 hours from now'; end if;
  if (_start at time zone 'America/Los_Angeles')::time < '08:00' or (_end at time zone 'America/Los_Angeles') > ((_start at time zone 'America/Los_Angeles')::date + time '23:00') then
    raise exception 'Rentals run between 8 AM and 11 PM'; end if;
  setup := least(greatest(coalesce((_addons->>'setup_hours')::int,0),0),4);
  blk_start := _start - make_interval(hours => setup);
  perform pg_advisory_xact_lock(hashtext('studio_a'));
  if exists (select 1 from public.studio_busy((blk_start at time zone 'America/Los_Angeles')::date, (_end at time zone 'America/Los_Angeles')::date) b
             where b.starts_at < _end and b.ends_at > blk_start) then
    raise exception 'That time is not available'; end if;
  if _use_pack and _type = 'podcast' then
    select coalesce(sum(hours - hours_used),0) into avail from public.hour_packs where user_id=uid and status='paid';
  end if;
  q := public.rental_price(_type, _start, _end, _addons, avail);
  used := (q->>'pack_hours')::numeric;
  left_h := used;
  for p in select * from public.hour_packs where user_id=uid and status='paid' and hours > hours_used order by created_at loop
    exit when left_h <= 0;
    take := least(left_h, p.hours - p.hours_used);
    update public.hour_packs set hours_used = hours_used + take where id=p.id;
    left_h := left_h - take;
  end loop;
  if (q->>'total')::int - (q->>'deposit')::int > 0 then
    insert into public.invoices(client_name,email,kind,description,amount_cents,issued_on,due_on,status)
    values (_name,_email,'rental','Studio A rental balance', (q->>'total')::int - (q->>'deposit')::int, current_date,
      greatest(current_date, ((_start at time zone 'America/Los_Angeles')::date - 3)), 'draft') returning id into inv;
  end if;
  insert into public.rentals(user_id,renter,email,phone,starts_at,ends_at,rate_type,rate_cents,deposit_cents,status,rental_type,headcount,addons,
    quote_cents,security_deposit_cents,agreement_name,agreement_signed_at,balance_due_on,pack_hours_used,invoice_id,balance_paid)
  values (uid,_name,_email,nullif(_phone,''),_start,_end, case when _type in ('half_day','full_day') then 'day' else 'hourly' end,
    case _type when 'podcast' then s.podcast_hourly_cents when 'package' then s.package_hourly_cents when 'half_day' then s.half_day_cents else s.full_day_cents end,
    (q->>'deposit')::int, 'deposit_due', _type, _headcount, coalesce(_addons,'{}'), (q->>'total')::int, s.security_deposit_cents,
    trim(_signature), now(), (_start at time zone 'America/Los_Angeles')::date - 3, used, inv, inv is null)
  returning id into rid;
  return q || jsonb_build_object('id', rid);
end $$;

create or replace function public.cancel_my_rental(_rental uuid)
returns int language plpgsql security definer set search_path to 'public' as $$
declare r public.rentals; pct int; d interval;
begin
  select * into r from public.rentals where id=_rental and user_id=auth.uid() and status not in ('canceled','completed');
  if not found then raise exception 'Booking not found'; end if;
  d := r.starts_at - now();
  pct := case when d >= interval '7 days' then 100 when d >= interval '48 hours' then 50 else 0 end;
  update public.rentals set status='canceled', refund_pct=pct where id=_rental;
  update public.hour_packs set hours_used = greatest(hours_used - r.pack_hours_used, 0)
   where id = (select id from public.hour_packs where user_id=auth.uid() and status='paid' order by created_at desc limit 1) and r.pack_hours_used > 0;
  if r.invoice_id is not null then update public.invoices set status='void' where id=r.invoice_id and status <> 'paid'; end if;
  return pct;
end $$;

create or replace function public.buy_hour_pack(_name text, _email text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare s public.rental_settings;
begin
  if auth.uid() is null then raise exception 'Please sign in first'; end if;
  if length(coalesce(trim(_name),'')) < 1 or length(_name) > 100 or length(coalesce(_email,'')) < 3 then raise exception 'Name and email are required'; end if;
  select * into s from public.rental_settings where id=1;
  insert into public.hour_packs(user_id,name,email,hours,price_cents)
  values (auth.uid(), trim(_name), _email, s.pack_hours, round(s.pack_hours * s.podcast_hourly_cents * (100 - s.pack_discount_pct) / 100.0));
end $$;

-- Rental money flows into Finance income under "Studio Rentals"
create or replace function public.rental_income() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.deposit_paid and not coalesce(old.deposit_paid,false) and new.deposit_cents > 0 then
    insert into public.income(stream,amount_cents,memo) values ('rentals', new.deposit_cents, 'Rental deposit — ' || new.renter);
  end if;
  if new.balance_paid and not coalesce(old.balance_paid,false) and new.quote_cents - new.deposit_cents > 0 then
    insert into public.income(stream,amount_cents,memo,invoice_id) values ('rentals', new.quote_cents - new.deposit_cents, 'Rental balance — ' || new.renter, new.invoice_id);
  end if;
  return new;
end $$;
create trigger rentals_income after update on public.rentals for each row execute function public.rental_income();

create or replace function public.pack_income() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.status='paid' and old.status <> 'paid' then
    insert into public.income(stream,amount_cents,memo) values ('rentals', new.price_cents, 'Hour pack — ' || new.name);
  end if;
  return new;
end $$;
create trigger hour_packs_income after update on public.hour_packs for each row execute function public.pack_income();

revoke execute on function public.rental_income() from public, anon, authenticated;
revoke execute on function public.pack_income() from public, anon, authenticated;
grant execute on function public.studio_busy(date,date) to anon, authenticated;
grant execute on function public.rental_price(text,timestamptz,timestamptz,jsonb,numeric) to anon, authenticated;
-- ===================================================================
-- 0005_volunteers_experts_contact_messaging.sql
-- ===================================================================
alter type public.app_role add value if not exists 'volunteer';

-- Staff = admin or crew only (volunteers are not staff)
create or replace function public.is_staff(_user_id uuid) returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role::text in ('admin','crew'))
$$;

-- Volunteers
create table public.volunteers (
  user_id uuid primary key,
  name text not null,
  email text not null,
  phone text,
  roles text[] not null default '{}',
  availability text,
  license_path text,
  insurance_path text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.volunteers to authenticated;
grant all on public.volunteers to service_role;
alter table public.volunteers enable row level security;
create policy "volunteer reads own" on public.volunteers for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "volunteer updates own" on public.volunteers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin manages volunteers" on public.volunteers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.join_volunteers(_name text, _phone text, _roles text[], _availability text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  if length(coalesce(trim(_name),'')) < 1 or length(_name) > 100 then raise exception 'Name is required'; end if;
  if cardinality(coalesce(_roles,'{}')) = 0 then raise exception 'Pick at least one role'; end if;
  insert into public.volunteers(user_id,name,email,phone,roles,availability)
  values (uid, trim(_name), coalesce(auth.jwt()->>'email',''), nullif(_phone,''), _roles, left(_availability,1000))
  on conflict (user_id) do update set name=excluded.name, phone=excluded.phone, roles=excluded.roles, availability=excluded.availability, status='active';
  insert into public.user_roles(user_id, role) select uid, 'volunteer'::public.app_role
  where not exists (select 1 from public.user_roles where user_id=uid and role::text='volunteer');
end $$;

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  taping_id uuid not null references public.tapings(id) on delete cascade,
  role text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  slots int not null default 1,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shifts to authenticated;
grant all on public.shifts to service_role;
alter table public.shifts enable row level security;
create policy "signed in read shifts" on public.shifts for select to authenticated using (true);
create policy "staff manage shifts" on public.shifts for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.shift_claims (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  user_id uuid not null,
  status text not null default 'claimed',
  hours numeric,
  created_at timestamptz not null default now(),
  unique (shift_id, user_id)
);
grant select, insert, update, delete on public.shift_claims to authenticated;
grant all on public.shift_claims to service_role;
alter table public.shift_claims enable row level security;
create policy "read own or staff claims" on public.shift_claims for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff manage claims" on public.shift_claims for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.shift_openings()
returns table(shift_id uuid, claimed int) language sql stable security definer set search_path to 'public' as $$
  select s.id, (select count(*)::int from public.shift_claims c where c.shift_id=s.id and c.status <> 'released') from public.shifts s
$$;

create or replace function public.claim_shift(_shift uuid) returns void language plpgsql security definer set search_path to 'public' as $$
declare s public.shifts; n int;
begin
  if not exists (select 1 from public.volunteers where user_id=auth.uid() and status='active') then raise exception 'Sign up as a volunteer first'; end if;
  select * into s from public.shifts where id=_shift for update;
  if not found then raise exception 'Shift not found'; end if;
  if s.starts_at < now() then raise exception 'This shift has already started'; end if;
  select count(*) into n from public.shift_claims where shift_id=_shift and status <> 'released' and user_id <> auth.uid();
  if n >= s.slots then raise exception 'This shift is full'; end if;
  insert into public.shift_claims(shift_id,user_id) values (_shift, auth.uid())
  on conflict (shift_id,user_id) do update set status='claimed';
end $$;

create or replace function public.release_shift(_shift uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.shift_claims set status='released' where shift_id=_shift and user_id=auth.uid() and status='claimed';
  if not found then raise exception 'Shift not found'; end if;
end $$;

-- Live specials
alter table public.episodes add column live_at timestamptz, add column chat_url text;

-- Experts / guest hub (admin only)
create table public.experts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  field text,
  email text,
  phone text,
  topics text,
  past_appearances text,
  notes text,
  created_at timestamptz not null default now()
);
create table public.expert_bookings (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.experts(id) on delete cascade,
  taping_id uuid not null references public.tapings(id) on delete cascade,
  status text not null default 'invited',
  briefing text,
  briefing_sent_at timestamptz,
  clip_1 text, clip_2 text, clip_3 text, clip_4 text, clip_5 text,
  clips_sent_at timestamptz,
  posted boolean not null default false,
  created_at timestamptz not null default now()
);
-- Contact / sponsor inquiries
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  name text not null,
  email text not null,
  phone text,
  organization text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
-- Taping announcements to ticket holders
create table public.taping_messages (
  id uuid primary key default gen_random_uuid(),
  taping_id uuid not null references public.tapings(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.experts, public.expert_bookings, public.contact_messages, public.taping_messages to authenticated;
grant insert on public.contact_messages to anon;
grant all on public.experts, public.expert_bookings, public.contact_messages, public.taping_messages to service_role;
alter table public.experts enable row level security;
alter table public.expert_bookings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.taping_messages enable row level security;
create policy "admin experts" on public.experts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin expert bookings" on public.expert_bookings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "anyone sends contact" on public.contact_messages for insert to anon, authenticated
  with check (status='new' and topic in ('tickets','rentals','sponsors','press','general') and length(name) between 1 and 100 and length(email) between 3 and 255 and length(message) between 1 and 4000);
create policy "admin contact" on public.contact_messages for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "staff manage taping messages" on public.taping_messages for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "ticket holders read messages" on public.taping_messages for select to authenticated using (exists (select 1 from public.reservations r where r.taping_id=taping_messages.taping_id and r.user_id=auth.uid() and r.status in ('confirmed','checked_in')));

-- SMS opt-in on reservations
alter table public.reservations add column sms_opt_in boolean not null default false, add column sms_phone text;
create or replace function public.set_sms_pref(_reservation uuid, _opt boolean, _phone text) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if _opt and (length(coalesce(_phone,'')) < 7 or length(_phone) > 20) then raise exception 'Enter a valid mobile number'; end if;
  update public.reservations set sms_opt_in=_opt, sms_phone=case when _opt then _phone else sms_phone end where id=_reservation and user_id=auth.uid();
  if not found then raise exception 'Reservation not found'; end if;
end $$;

-- Volunteer documents: private bucket policies (owner uploads to own folder; admin reads)
create policy "volunteer uploads own docs" on storage.objects for insert to authenticated with check (bucket_id='volunteer-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "volunteer replaces own docs" on storage.objects for update to authenticated using (bucket_id='volunteer-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "admin reads volunteer docs" on storage.objects for select to authenticated using (bucket_id='volunteer-docs' and public.has_role(auth.uid(),'admin'));
-- ===================================================================
-- 0006_crew_invites_door_feedback_prayer.sql
-- ===================================================================
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
-- ===================================================================
-- 0007_prelaunch_waitlist.sql
-- ===================================================================
-- Prelaunch waitlist + referrals, partner inquiries, prelaunch site settings.
-- The waitlist table is deliberately reusable for ticketing: status walks
-- waitlist -> invited -> ticketed, so the ticket launch reads the same rows.

-- ---------------------------------------------------------------- waitlist
create type public.waitlist_status as enum ('waitlist', 'invited', 'ticketed');

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  sms_opt_in boolean not null default false,
  zip text,
  source text,
  church_group boolean not null default false,
  church_name text,

  -- referrals
  referral_code text not null,
  referred_by uuid references public.waitlist_signups(id) on delete set null,
  referral_count int not null default 0,

  -- signup_order is the raw join order; list_position is derived from it so the
  -- two can never drift. 5 spots per confirmed referral, floored at 1.
  signup_order bigint generated by default as identity,
  list_position int generated always as (greatest(1, signup_order - 5 * referral_count)) stored,

  status public.waitlist_status not null default 'waitlist',
  confirmed_at timestamptz,
  confirm_token uuid not null default gen_random_uuid(),
  invited_at timestamptz,

  -- attribution
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  import_source text,

  created_at timestamptz not null default now()
);

-- Case-insensitive email uniqueness without needing the citext extension.
create unique index waitlist_signups_email_key on public.waitlist_signups (lower(email));
create unique index waitlist_signups_referral_code_key on public.waitlist_signups (lower(referral_code));
-- Phone is optional, so only de-duplicate the rows that actually have one.
create unique index waitlist_signups_phone_key on public.waitlist_signups (phone) where phone is not null;
create index waitlist_signups_referred_by_idx on public.waitlist_signups (referred_by);
create index waitlist_signups_created_at_idx on public.waitlist_signups (created_at desc);
create index waitlist_signups_status_idx on public.waitlist_signups (status);

-- No anon grants: the public never reads this table directly. Signup and
-- confirmation go through security-definer RPCs so one email can never be used
-- to enumerate another person's position.
grant select, update on public.waitlist_signups to authenticated;
grant all on public.waitlist_signups to service_role;
alter table public.waitlist_signups enable row level security;

create policy "admin read waitlist" on public.waitlist_signups
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin update waitlist" on public.waitlist_signups
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------- referral codes
-- Alphabet omits 0/O/1/I/L so codes stay readable when read aloud or typed
-- off a postcard.
create or replace function public.gen_referral_code()
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  for attempt in 1..20 loop
    code := '';
    for i in 1..7 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from public.waitlist_signups where lower(referral_code) = lower(code)) then
      return code;
    end if;
  end loop;
  -- Fall back to something guaranteed unique rather than failing the signup.
  return 'R' || replace(gen_random_uuid()::text, '-', '');
end $$;

-- ------------------------------------------------------------ join waitlist
-- Returns the caller's own row only. A repeat email gets its existing position
-- and link back instead of an error, and never overwrites the stored details.
create or replace function public.join_waitlist(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text default null,
  p_sms_opt_in boolean default false,
  p_zip text default null,
  p_source text default null,
  p_church_group boolean default false,
  p_church_name text default null,
  p_ref_code text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_term text default null,
  p_utm_content text default null
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_phone text := nullif(trim(coalesce(p_phone, '')), '');
  v_row public.waitlist_signups;
  v_referrer uuid;
  v_require boolean;
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 255 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if length(coalesce(trim(p_first_name), '')) = 0 or length(coalesce(trim(p_last_name), '')) = 0 then
    raise exception 'name_required' using errcode = '22023';
  end if;
  if length(p_first_name) > 80 or length(p_last_name) > 80 or length(coalesce(p_church_name, '')) > 120
     or length(coalesce(p_zip, '')) > 12 or length(coalesce(p_source, '')) > 40 then
    raise exception 'field_too_long' using errcode = '22023';
  end if;

  -- Already on the list: hand back what they had.
  select * into v_row from public.waitlist_signups where lower(email) = v_email;
  if found then
    return jsonb_build_object(
      'already', true,
      'position', v_row.list_position,
      'referral_code', v_row.referral_code,
      'referral_count', v_row.referral_count,
      'confirmed', v_row.confirmed_at is not null,
      'confirm_token', case when v_row.confirmed_at is null then v_row.confirm_token end,
      'first_name', v_row.first_name,
      'email', v_row.email
    );
  end if;

  if p_ref_code is not null and length(trim(p_ref_code)) > 0 then
    select id into v_referrer from public.waitlist_signups
      where lower(referral_code) = lower(trim(p_ref_code));
  end if;

  select coalesce(require_email_confirm, false) into v_require
    from public.site_settings where id = 1;
  v_require := coalesce(v_require, false);

  insert into public.waitlist_signups (
    first_name, last_name, email, phone, sms_opt_in, zip, source,
    church_group, church_name, referral_code, referred_by, confirmed_at,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content
  ) values (
    trim(p_first_name), trim(p_last_name), v_email, v_phone,
    coalesce(p_sms_opt_in, false) and v_phone is not null,
    nullif(trim(coalesce(p_zip, '')), ''), nullif(trim(coalesce(p_source, '')), ''),
    coalesce(p_church_group, false),
    case when coalesce(p_church_group, false) then nullif(trim(coalesce(p_church_name, '')), '') end,
    public.gen_referral_code(), v_referrer,
    case when v_require then null else now() end,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term, p_utm_content
  ) returning * into v_row;

  -- With no confirm step the referral pays out right here instead.
  if not v_require and v_referrer is not null then
    update public.waitlist_signups set referral_count = referral_count + 1 where id = v_referrer;
  end if;

  return jsonb_build_object(
    'already', false,
    'position', v_row.list_position,
    'referral_code', v_row.referral_code,
    'referral_count', 0,
    'confirmed', not v_require,
    'confirm_token', case when v_require then v_row.confirm_token end,
    'first_name', v_row.first_name,
    'email', v_row.email
  );
end $$;

-- --------------------------------------------------------------- confirm
-- Referrals only pay out here, so an unconfirmed address can't move anyone up.
create or replace function public.confirm_waitlist(p_token uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_row public.waitlist_signups;
begin
  select * into v_row from public.waitlist_signups where confirm_token = p_token;
  if not found then
    raise exception 'invalid_token' using errcode = '22023';
  end if;

  if v_row.confirmed_at is null then
    update public.waitlist_signups set confirmed_at = now() where id = v_row.id returning * into v_row;
    if v_row.referred_by is not null then
      update public.waitlist_signups
        set referral_count = referral_count + 1
        where id = v_row.referred_by;
    end if;
  end if;

  return jsonb_build_object(
    'position', v_row.list_position,
    'referral_code', v_row.referral_code,
    'referral_count', v_row.referral_count,
    'first_name', v_row.first_name,
    'confirmed', true
  );
end $$;

-- Public entry points are reached through the server (service role) only.
revoke all on function public.join_waitlist(text,text,text,text,boolean,text,text,boolean,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.confirm_waitlist(uuid) from public, anon, authenticated;
revoke all on function public.gen_referral_code() from public, anon, authenticated;

-- ----------------------------------------------------------- admin helpers
-- Admin tools are reached two ways: straight from the browser with the admin's
-- own JWT, and from server functions (which hold the service role and have
-- already checked the caller). security definer hides the real role from
-- current_user, so read it off the PostgREST claims instead.
create or replace function public.is_admin_or_service()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
      or coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') = 'service_role'
$$;

-- Dashboard aggregates in one round trip. Each breakdown groups in an inner
-- query and builds its JSON in the outer one -- an aggregate cannot appear in
-- GROUP BY, so the two steps have to stay separate.
create or replace function public.waitlist_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_admin_or_service() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total', (select count(*) from public.waitlist_signups),
    'confirmed', (select count(*) from public.waitlist_signups where confirmed_at is not null),
    'sms_opt_in', (select count(*) from public.waitlist_signups where sms_opt_in),
    'invited', (select count(*) from public.waitlist_signups where status = 'invited'),
    'ticketed', (select count(*) from public.waitlist_signups where status = 'ticketed'),
    'church_groups', (select count(*) from public.waitlist_signups where church_group),

    'per_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'count', n) order by day)
      from (
        select to_char(created_at at time zone 'America/Los_Angeles', 'YYYY-MM-DD') as day,
               count(*) as n
        from public.waitlist_signups
        where created_at > now() - interval '90 days'
        group by 1
      ) s), '[]'::jsonb),

    'top_sources', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc, label)
      from (
        select coalesce(source, 'Unknown') as label, count(*) as n
        from public.waitlist_signups group by 1 order by n desc limit 12
      ) s), '[]'::jsonb),

    'top_zips', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc, label)
      from (
        select zip as label, count(*) as n
        from public.waitlist_signups where zip is not null group by 1 order by n desc limit 12
      ) s), '[]'::jsonb),

    'top_referrers', coalesce((
      select jsonb_agg(jsonb_build_object(
               'label', label, 'email', email, 'code', code, 'count', n) order by n desc)
      from (
        select first_name || ' ' || left(last_name, 1) || '.' as label,
               email, referral_code as code, referral_count as n
        from public.waitlist_signups
        where referral_count > 0 order by referral_count desc limit 12
      ) s), '[]'::jsonb),

    'churches', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc, label)
      from (
        select coalesce(church_name, 'Unnamed') as label, count(*) as n
        from public.waitlist_signups where church_group group by 1 order by n desc limit 25
      ) s), '[]'::jsonb),

    'top_utm', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc, label)
      from (
        select utm_source || coalesce(' / ' || utm_campaign, '') as label, count(*) as n
        from public.waitlist_signups where utm_source is not null group by 1 order by n desc limit 12
      ) s), '[]'::jsonb)
  ) into v;
  return v;
end $$;

-- "Invite top N to early access". Returns the invited rows so the caller can
-- email them; already-invited people are skipped so a second click is safe.
create or replace function public.invite_top_waitlist(p_count int)
returns table (id uuid, email text, first_name text, list_position int, referral_code text)
language plpgsql volatile security definer set search_path = public as $$
-- The OUT columns share their names with real columns, so tell plpgsql that a
-- bare name means the column rather than the output variable.
#variable_conflict use_column
begin
  if not public.is_admin_or_service() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_count is null or p_count < 1 or p_count > 5000 then
    raise exception 'invalid_count' using errcode = '22023';
  end if;

  return query
  with picked as (
    select w.id from public.waitlist_signups w
    where w.status = 'waitlist' and w.confirmed_at is not null
    order by w.list_position, w.signup_order
    limit p_count
  )
  update public.waitlist_signups w
     set status = 'invited', invited_at = now()
   where w.id in (select id from picked)
  returning w.id, w.email, w.first_name, w.list_position, w.referral_code;
end $$;

-- CSV import from Substack / the SMS tool. Merges on email, then phone, so a
-- subscriber who already signed up on the site is tagged rather than doubled.
create or replace function public.import_waitlist(p_rows jsonb, p_source text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  r jsonb;
  v_email text;
  v_phone text;
  v_existing uuid;
  v_inserted int := 0;
  v_merged int := 0;
  v_skipped int := 0;
begin
  if not public.is_admin_or_service() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_email := lower(nullif(trim(coalesce(r->>'email', '')), ''));
    v_phone := nullif(regexp_replace(coalesce(r->>'phone', ''), '[^0-9+]', '', 'g'), '');
    if v_phone is not null and length(v_phone) < 7 then v_phone := null; end if;

    if v_email is null and v_phone is null then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    v_existing := null;
    if v_email is not null then
      select id into v_existing from public.waitlist_signups where lower(email) = v_email;
    end if;
    if v_existing is null and v_phone is not null then
      select id into v_existing from public.waitlist_signups where phone = v_phone;
    end if;

    if v_existing is not null then
      -- Fill gaps and tag the extra source without clobbering site data.
      update public.waitlist_signups
         set phone = coalesce(phone, v_phone),
             zip = coalesce(zip, nullif(trim(coalesce(r->>'zip', '')), '')),
             import_source = case
               when import_source is null then p_source
               when import_source like '%' || p_source || '%' then import_source
               else import_source || ',' || p_source
             end
       where id = v_existing;
      v_merged := v_merged + 1;
    else
      insert into public.waitlist_signups (
        first_name, last_name, email, phone, zip, source, import_source,
        referral_code, sms_opt_in, confirmed_at
      ) values (
        coalesce(nullif(trim(coalesce(r->>'first_name', '')), ''), 'Friend'),
        coalesce(nullif(trim(coalesce(r->>'last_name', '')), ''), ''),
        coalesce(v_email, v_phone || '@imported.invalid'),
        v_phone,
        nullif(trim(coalesce(r->>'zip', '')), ''),
        p_source,
        p_source,
        public.gen_referral_code(),
        coalesce((r->>'sms_opt_in')::boolean, false),
        -- Imported subscribers already opted in upstream.
        coalesce((r->>'confirmed_at')::timestamptz, now())
      );
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object('inserted', v_inserted, 'merged', v_merged, 'skipped', v_skipped);
end $$;

grant execute on function public.waitlist_stats() to authenticated;
grant execute on function public.invite_top_waitlist(int) to authenticated;
grant execute on function public.import_waitlist(jsonb, text) to authenticated;

-- -------------------------------------------------------- partner inquiries
create table public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text,
  email text not null,
  phone text,
  interest text not null,
  message text,
  status text not null default 'new',
  admin_note text,
  created_at timestamptz not null default now()
);

grant insert on public.partner_inquiries to anon, authenticated;
grant select, update, delete on public.partner_inquiries to authenticated;
grant all on public.partner_inquiries to service_role;
alter table public.partner_inquiries enable row level security;

-- Anyone may submit, but the length caps stop the form being used as storage.
create policy "anyone submit inquiry" on public.partner_inquiries
  for insert to anon, authenticated with check (
    length(name) between 1 and 120
    and length(email) between 3 and 255
    and length(coalesce(business, '')) <= 160
    and length(coalesce(phone, '')) <= 40
    and length(interest) <= 60
    and length(coalesce(message, '')) <= 2000
    and status = 'new'
    and admin_note is null
  );
create policy "staff read inquiries" on public.partner_inquiries
  for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin manage inquiries" on public.partner_inquiries
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin delete inquiries" on public.partner_inquiries
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------- prelaunch settings
-- Everything the prelaunch page shows is editable in admin. A null
-- ticket_drop_at hides the countdown entirely.
alter table public.site_settings
  add column ticket_drop_at timestamptz,
  add column sms_keyword text not null default 'IHNM',
  add column sms_number text,
  add column substack_url text,
  add column url_youtube text,
  add column url_instagram text,
  add column url_tiktok text,
  add column url_facebook text,
  add column url_threads text,
  add column url_nextdoor text,
  add column media_kit_path text,
  add column hero_headline text not null default 'Be in the first audience.',
  add column hero_subline text not null default
    'A live talk show where Scripture, history and today''s headlines meet. Studio A, San Jose · Launching March 2027.',
  add column weekly_position_emails boolean not null default false,
  -- Substack sends the newsletter but cannot send per-person token links, so
  -- confirmation is off until a transactional sender is connected. Flip this on
  -- the day one exists and the confirm flow below starts gating referrals.
  add column require_email_confirm boolean not null default false;

-- ------------------------------------------------------------- media bucket
-- Public bucket for the media kit PDF and the OG share image.
insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');
create policy "admin write media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "admin update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "admin delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

