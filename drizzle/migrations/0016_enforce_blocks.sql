-- Enforce blocks where someone actually gets in: booking a seat, signing up to
-- volunteer, and claiming a shift. Bodies are otherwise unchanged.

create or replace function public.reserve_seat(_taping uuid, _name text, _email text, _question text, _consent boolean, _minors text[] default '{}'::text[], _accessible boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare t public.tapings; r public.reservations; uid uuid := auth.uid(); need int; m text[];
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  -- Blocked from the audience: say so plainly, with the reason they were given.
  if public.is_blocked(uid, 'audience') then
    raise exception 'You are not able to book a seat. %',
      coalesce(public.my_block_reason('audience'), 'Please contact us if you think this is a mistake.');
  end if;
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
end $function$;

create or replace function public.join_volunteers(_name text, _phone text, _roles text[], _availability text)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Please sign in first'; end if;
  if public.is_blocked(uid, 'volunteer') then
    raise exception 'You are not able to sign up to volunteer. %',
      coalesce(public.my_block_reason('volunteer'), 'Please contact us if you think this is a mistake.');
  end if;
  if length(coalesce(trim(_name),'')) < 1 or length(_name) > 100 then raise exception 'Name is required'; end if;
  if cardinality(coalesce(_roles,'{}')) = 0 then raise exception 'Pick at least one role'; end if;
  insert into public.volunteers(user_id,name,email,phone,roles,availability)
  values (uid, trim(_name), coalesce(auth.jwt()->>'email',''), nullif(_phone,''), _roles, left(_availability,1000))
  on conflict (user_id) do update set name=excluded.name, phone=excluded.phone, roles=excluded.roles, availability=excluded.availability, status='active';
  insert into public.user_roles(user_id, role) select uid, 'volunteer'::public.app_role
  where not exists (select 1 from public.user_roles where user_id=uid and role::text='volunteer');
end $function$;

create or replace function public.claim_shift(_shift uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare s public.shifts; n int;
begin
  if public.is_blocked(auth.uid(), 'volunteer') then
    raise exception 'You are not able to claim shifts. %',
      coalesce(public.my_block_reason('volunteer'), 'Please contact us if you think this is a mistake.');
  end if;
  if not exists (select 1 from public.volunteers where user_id=auth.uid() and status='active') then raise exception 'Sign up as a volunteer first'; end if;
  select * into s from public.shifts where id=_shift for update;
  if not found then raise exception 'Shift not found'; end if;
  if s.starts_at < now() then raise exception 'This shift has already started'; end if;
  select count(*) into n from public.shift_claims where shift_id=_shift and status <> 'released' and user_id <> auth.uid();
  if n >= s.slots then raise exception 'This shift is full'; end if;
  insert into public.shift_claims(shift_id,user_id) values (_shift, auth.uid())
  on conflict (shift_id,user_id) do update set status='claimed';
end $function$;

-- Crew see who is flagged at the door: repeated no-shows as before, plus
-- anyone blocked. The return shape changes, so the old one must go first.
drop function if exists public.flagged_attendees(uuid);
create function public.flagged_attendees(_taping uuid)
returns table(user_id uuid, no_shows int, blocked boolean, reason text)
language sql stable security definer set search_path to 'public' as $$
  select r.user_id,
         public.no_show_count(r.user_id),
         public.is_blocked(r.user_id, 'audience'),
         (select b.reason from public.person_blocks b
           where b.lifted_at is null and b.user_id = r.user_id
             and b.scope in ('audience', 'both')
           order by b.created_at desc limit 1)
  from public.reservations r
  where r.taping_id = _taping
    and public.is_staff(auth.uid())
    and (public.no_show_count(r.user_id) >= 2 or public.is_blocked(r.user_id, 'audience'))
  group by r.user_id
$$;
