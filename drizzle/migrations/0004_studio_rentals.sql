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