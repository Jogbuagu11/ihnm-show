-- An unsubscribe page that cannot undo a mis-click is a support ticket
-- waiting to happen, and the win-back journey's "keep me on the list" needs
-- somewhere to land.
create or replace function public.resubscribe_by_token(
  _token text, _brand public.contact_brand default 'show'
) returns table (email text, brand public.contact_brand)
language plpgsql volatile security definer set search_path = public as $$
-- The OUT parameter is named brand, same as the column it is inserted into.
#variable_conflict use_column
declare v_id uuid; v_email text;
begin
  select c.id, c.email into v_id, v_email
  from public.contacts c where c.unsub_token = _token;
  if v_id is null then return; end if;

  -- A suppressed address is suppressed for a reason: a bounce or a spam
  -- complaint. Re-subscribing must not override that.
  if exists (select 1 from public.suppressions s where lower(s.email) = lower(v_email)) then
    return;
  end if;

  insert into public.contact_consent (contact_id, brand, subscribed, unsubscribed_at, reason)
  values (v_id, _brand, true, null, 'resubscribed')
  on conflict (contact_id, brand) do update set
    subscribed = true, unsubscribed_at = null, reason = 'resubscribed', updated_at = now();
  perform public.log_contact_event(v_id, 'resubscribed', jsonb_build_object('brand', _brand));
  return query select v_email, _brand;
end $$;
grant execute on function public.resubscribe_by_token(text, public.contact_brand)
  to anon, authenticated;
