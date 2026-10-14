create policy "giver reads own by email" on public.partners for select to authenticated using (email is not null and lower(email) = lower(auth.jwt()->>'email'));
create or replace function public.cancel_my_giving(_partner uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.partners set status='canceled'
  where id=_partner and status <> 'canceled'
    and (user_id = auth.uid() or (email is not null and lower(email) = lower(auth.jwt()->>'email')));
  if not found then raise exception 'Gift not found'; end if;
end $$;