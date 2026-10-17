-- Per-journey counts for the admin. One query rather than six per row.
create or replace function public.journey_stats()
returns table (
  journey_id uuid, entered bigint, active bigint, completed bigint,
  exited bigint, failed bigint, sent bigint, clicked bigint
) language sql stable security definer set search_path = public as $$
  select
    j.id,
    count(distinct r.id),
    count(distinct r.id) filter (where r.status = 'active'),
    count(distinct r.id) filter (where r.status = 'completed'),
    count(distinct r.id) filter (where r.status = 'exited'),
    count(distinct r.id) filter (where r.status = 'failed'),
    (select count(*) from public.message_log m
      join public.journey_runs mr on mr.id = m.journey_run_id
     where mr.journey_id = j.id),
    (select count(*) from public.link_clicks lc
      join public.tracked_links t on t.token = lc.token
     where t.campaign like 'journey:' || j.key || ':%')
  from public.journeys j
  left join public.journey_runs r on r.journey_id = j.id
  group by j.id
$$;
grant execute on function public.journey_stats() to authenticated;
