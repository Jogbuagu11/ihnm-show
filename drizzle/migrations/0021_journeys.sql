-- Journeys engine. Journeys, steps and templates are rows, so changing a
-- sequence or a subject line is an admin edit rather than a deploy.

create type public.journey_step_type as enum (
  'send_email', 'send_sms', 'wait', 'condition',
  'add_tag', 'remove_tag', 'start_journey', 'admin_task', 'notify_admin'
);
create type public.journey_run_status as enum ('active', 'completed', 'exited', 'failed');

create table public.email_templates (
  key text primary key,
  brand public.contact_brand not null default 'show',
  subject text not null,
  html text not null,
  updated_at timestamptz not null default now()
);

create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  brand public.contact_brand not null default 'show',
  -- A contact enters when an event of this type lands on their timeline.
  trigger_event text not null,
  -- Optional jsonb match against the event payload.
  trigger_filter jsonb not null default '{}'::jsonb,
  -- Reaching this event ends the run early: a purchase stops the nudges.
  goal_event text,
  -- Off by default so a half-built journey cannot email anyone.
  enabled boolean not null default false,
  -- Most journeys should run once per contact.
  allow_reentry boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.journey_steps (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  position int not null,
  type public.journey_step_type not null,
  config jsonb not null default '{}'::jsonb,
  -- Explicit graph rather than implicit ordering, so a branch can rejoin.
  next_step_id uuid references public.journey_steps(id) on delete set null,
  -- Conditions only: where "no" goes. Null ends the run.
  alt_step_id uuid references public.journey_steps(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (journey_id, position)
);
create index journey_steps_journey_idx on public.journey_steps (journey_id, position);

create table public.journey_runs (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  current_step_id uuid references public.journey_steps(id) on delete set null,
  status public.journey_run_status not null default 'active',
  next_run_at timestamptz not null default now(),
  entered_at timestamptz not null default now(),
  completed_at timestamptz,
  exit_reason text,
  context jsonb not null default '{}'::jsonb
);
create index journey_runs_due_idx on public.journey_runs (next_run_at)
  where status = 'active';
create index journey_runs_contact_idx on public.journey_runs (contact_id);
-- One live run per contact per journey unless re-entry is allowed.
create unique index journey_runs_once_idx on public.journey_runs (journey_id, contact_id)
  where status = 'active';

-- The idempotency record. A step cannot execute twice for a run, which is what
-- stops a retry or an overlapping tick from sending the same email again.
create table public.journey_step_runs (
  run_id uuid not null references public.journey_runs(id) on delete cascade,
  step_id uuid not null references public.journey_steps(id) on delete cascade,
  done_at timestamptz not null default now(),
  result jsonb not null default '{}'::jsonb,
  primary key (run_id, step_id)
);

-- Every send, for the daily cap and for per-step stats.
create table public.message_log (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  template_key text,
  journey_run_id uuid references public.journey_runs(id) on delete set null,
  step_id uuid references public.journey_steps(id) on delete set null,
  transactional boolean not null default false,
  sent_at timestamptz not null default now()
);
create index message_log_contact_idx on public.message_log (contact_id, sent_at desc);

create table public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  detail text,
  due_on date,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

grant select on public.journeys, public.journey_steps, public.journey_runs,
  public.journey_step_runs, public.message_log, public.email_templates,
  public.admin_tasks to authenticated;
grant all on public.journeys, public.journey_steps, public.journey_runs,
  public.journey_step_runs, public.message_log, public.email_templates,
  public.admin_tasks to service_role;

alter table public.journeys enable row level security;
alter table public.journey_steps enable row level security;
alter table public.journey_runs enable row level security;
alter table public.journey_step_runs enable row level security;
alter table public.message_log enable row level security;
alter table public.email_templates enable row level security;
alter table public.admin_tasks enable row level security;

do $$
declare t text;
begin
  foreach t in array array['journeys','journey_steps','journey_runs','journey_step_runs',
                           'message_log','email_templates','admin_tasks'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_staff(auth.uid()))',
      'staff read ' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))',
      'admin manage ' || t, t);
  end loop;
end $$;
