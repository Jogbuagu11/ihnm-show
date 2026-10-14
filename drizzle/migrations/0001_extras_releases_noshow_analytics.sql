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