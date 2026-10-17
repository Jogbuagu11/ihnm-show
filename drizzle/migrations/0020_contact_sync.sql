-- Feed the contact layer from what already happens on the site, so the
-- timeline is populated before any journey exists.

create or replace function public.sync_waitlist_contact()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_contact uuid;
begin
  v_contact := public.upsert_contact(
    new.email, 'show', new.first_name, new.last_name, new.phone,
    new.sms_opt_in, new.zip, new.source,
    case when new.church_group then array['church_group'] else '{}' end,
    '{}'
  );
  perform public.log_contact_event(v_contact, 'waitlist_joined',
    jsonb_build_object('position', new.list_position, 'referral_code', new.referral_code,
                       'referred_by', new.referred_by, 'utm_source', new.utm_source));
  -- A referral is an event on the referrer, not the person who joined.
  if new.referred_by is not null then
    perform public.log_contact_event(
      public.upsert_contact(
        (select email from public.waitlist_signups w where w.id = new.referred_by),
        'show', null, null, null, null, null, null, '{}', '{}'),
      'referral_made', jsonb_build_object('referred_email', new.email));
  end if;
  return new;
end $$;

create trigger on_waitlist_signup_contact
  after insert on public.waitlist_signups
  for each row execute function public.sync_waitlist_contact();

create or replace function public.sync_partner_contact()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_contact uuid;
begin
  v_contact := public.upsert_contact(new.email, 'show', new.name, null, new.phone,
    null, null, 'sponsor_inquiry', array['sponsor_prospect'], array['sponsorship']);
  perform public.log_contact_event(v_contact, 'sponsor_inquiry',
    jsonb_build_object('business', new.business, 'interest', new.interest));
  return new;
end $$;

create trigger on_partner_inquiry_contact
  after insert on public.partner_inquiries
  for each row execute function public.sync_partner_contact();

create or replace function public.sync_submission_contact()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_contact uuid;
begin
  -- A writer consents to the publishing brand, not the show.
  v_contact := public.upsert_contact(new.email, 'publishing', new.name, null, new.phone,
    null, null, 'manuscript_submission', array['author_prospect'], array['books']);
  perform public.log_contact_event(v_contact, 'submission_sent',
    jsonb_build_object('book_title', new.book_title, 'category', new.category));
  return new;
end $$;

create trigger on_submission_contact
  after insert on public.pub_submissions
  for each row execute function public.sync_submission_contact();

-- Backfill from the waitlist that already exists.
insert into public.contacts (email, first_name, last_name, phone, sms_opt_in, zip, source)
select lower(w.email), w.first_name, w.last_name, w.phone, w.sms_opt_in, w.zip, w.source
from public.waitlist_signups w
on conflict (lower(email)) do nothing;

insert into public.contact_consent (contact_id, brand)
select c.id, 'show' from public.contacts c
on conflict (contact_id, brand) do nothing;

insert into public.contact_events (contact_id, type, payload, occurred_at)
select c.id, 'waitlist_joined',
       jsonb_build_object('position', w.list_position, 'backfilled', true), w.created_at
from public.waitlist_signups w join public.contacts c on lower(c.email) = lower(w.email)
where not exists (
  select 1 from public.contact_events e
  where e.contact_id = c.id and e.type = 'waitlist_joined');
