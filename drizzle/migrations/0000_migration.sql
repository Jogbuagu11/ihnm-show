
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
