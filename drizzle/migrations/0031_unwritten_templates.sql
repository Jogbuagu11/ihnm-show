-- What is holding each switched-off journey off, named so the admin can list
-- it rather than making someone open every journey to find out.
create or replace function public.unwritten_templates()
returns table (template_key text, journey_name text, journey_key text)
language sql stable security definer set search_path = public as $$
  select distinct s.config->>'template', j.name, j.key
  from public.journey_steps s
  join public.journeys j on j.id = s.journey_id
  where s.type = 'send_email'
    and not exists (
      select 1 from public.email_templates t where t.key = s.config->>'template')
  order by j.name, 1
$$;
grant execute on function public.unwritten_templates() to authenticated;
