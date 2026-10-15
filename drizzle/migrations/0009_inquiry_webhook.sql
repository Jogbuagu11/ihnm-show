-- Inquiry alerts fired from the browser after the insert, so a dropped
-- connection between the two meant the row saved and nobody was told. The
-- trigger fires from Postgres instead, regardless of what the client does.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_inquiry_webhook()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_secret text := 'N54Ig2bC9A__PjjX_tgI6bI_Bp651zxA';
  v_url text := 'https://otdeqjknjkznruqpcjrn.supabase.co/functions/v1/notify-inquiry';
begin
  -- Fire and forget: pg_net queues the request, so a slow or failing endpoint
  -- can never block or roll back the insert the visitor is waiting on.
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    ),
    timeout_milliseconds := 5000
  );
  return NEW;
end $$;

create trigger notify_on_partner_inquiry
  after insert on public.partner_inquiries
  for each row execute function public.notify_inquiry_webhook();

create trigger notify_on_contact_message
  after insert on public.contact_messages
  for each row execute function public.notify_inquiry_webhook();

create trigger notify_on_rental_inquiry
  after insert on public.rental_inquiries
  for each row execute function public.notify_inquiry_webhook();
