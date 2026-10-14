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