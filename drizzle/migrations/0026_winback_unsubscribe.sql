-- Separate from 0025 because a new enum value cannot be used in the same
-- transaction that adds it.
update public.journey_steps s
   set type = 'unsubscribe',
       config = jsonb_build_object('reason', 'no_engagement_60_days')
  from public.journeys j
 where j.id = s.journey_id and j.key = 'winback' and s.position = 5;
