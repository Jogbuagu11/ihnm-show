-- Website-native membership. Billing is Stripe, but the source of truth for
-- "is this person a member right now" is this table, and only verified
-- webhooks or an admin comp may change status -- never the browser.

create type public.member_tier as enum ('member', 'partner');
create type public.member_interval as enum ('month', 'year');
create type public.member_status as enum ('trialing', 'active', 'past_due', 'paused', 'canceled');
create type public.founder_source as enum ('prelaunch', 'gift');
create type public.member_content_type as enum ('extended_interview', 'guest_notes');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier public.member_tier not null,
  "interval" public.member_interval not null,
  status public.member_status not null default 'trialing',

  -- Founding is permanent once earned: either joined before the cutoff, or
  -- gave a Founder gift afterwards.
  founding boolean not null default false,
  founder_source public.founder_source,
  founder_gift_amount_cents int,

  stripe_customer_id text,
  stripe_subscription_id text,
  -- Price IDs are stored per membership, which is what makes the founding
  -- price lock work: a future price change is a NEW price id and never
  -- touches rows already pointing at the old one.
  price_id text,

  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  -- Partner credits on episode end cards.
  credit_opt_in boolean not null default false,
  credit_name text,

  -- Comped memberships have no Stripe subscription and simply expire.
  comped boolean not null default false,
  comped_until timestamptz,
  comped_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index memberships_subscription_key
  on public.memberships (stripe_subscription_id) where stripe_subscription_id is not null;
create index memberships_user_idx on public.memberships (user_id);
create index memberships_status_idx on public.memberships (status);
create index memberships_founding_idx on public.memberships (founding) where founding;

grant select on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;

create policy "read own membership" on public.memberships
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
-- No insert/update policy on purpose: status changes come from the webhook
-- (service role) or an admin RPC, never from the client.
create policy "admin manage memberships" on public.memberships
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- One free VIP seat per Partner per calendar month, no rollover. The unique
-- index is what actually enforces it; application code cannot forget.
create table public.partner_free_seats (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  taping_id uuid references public.tapings(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  used_at timestamptz not null default now()
);
create unique index partner_free_seats_month_key on public.partner_free_seats (membership_id, month);

grant select on public.partner_free_seats to authenticated;
grant all on public.partner_free_seats to service_role;
alter table public.partner_free_seats enable row level security;
create policy "read own free seats" on public.partner_free_seats
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.memberships m
               where m.id = membership_id and m.user_id = auth.uid())
  );

-- Members-only content. Videos are unlisted YouTube links.
--
-- The table is NOT readable by anon or authenticated: an unlisted URL sitting
-- in a readable row could simply be fetched from the API, which would defeat
-- the lock entirely. Previews are served by member_content_feed() below, which
-- returns the URL only to an active member.
create table public.member_content (
  id uuid primary key default gen_random_uuid(),
  type public.member_content_type not null,
  episode_id uuid references public.episodes(id) on delete set null,
  title text not null,
  -- Shown to non-members, alongside a blurred thumbnail.
  summary text,
  body text,
  youtube_url text,
  thumbnail_url text,
  duration_seconds int,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index member_content_published_idx on public.member_content (published_at desc nulls last);
create index member_content_episode_idx on public.member_content (episode_id);

grant all on public.member_content to service_role;
grant select, insert, update, delete on public.member_content to authenticated;
alter table public.member_content enable row level security;
create policy "admin manage content" on public.member_content
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Does this user have benefits right now? past_due keeps benefits for 7 days
-- (Stripe retries in that window), paused and canceled do not.
create or replace function public.is_active_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = _user_id
      and (
        m.status in ('trialing', 'active')
        or (m.status = 'past_due' and m.updated_at > now() - interval '7 days')
      )
      and (not m.comped or m.comped_until is null or m.comped_until > now())
  )
$$;

create or replace function public.member_tier_of(_user_id uuid)
returns public.member_tier language sql stable security definer set search_path = public as $$
  select m.tier from public.memberships m
  where m.user_id = _user_id and public.is_active_member(_user_id)
  order by (m.tier = 'partner') desc limit 1
$$;

-- Preview for everyone, link for members only.
create or replace function public.member_content_feed()
returns table (
  id uuid, type public.member_content_type, episode_id uuid, title text,
  summary text, thumbnail_url text, duration_seconds int, published_at timestamptz,
  body text, youtube_url text, unlocked boolean
) language sql stable security definer set search_path = public as $$
  select c.id, c.type, c.episode_id, c.title,
         c.summary, c.thumbnail_url, c.duration_seconds, c.published_at,
         case when public.is_active_member(auth.uid()) then c.body end,
         case when public.is_active_member(auth.uid()) then c.youtube_url end,
         public.is_active_member(auth.uid())
  from public.member_content c
  where c.published_at is not null and c.published_at <= now()
  order by c.published_at desc
$$;
grant execute on function public.member_content_feed() to anon, authenticated;
grant execute on function public.is_active_member(uuid) to authenticated;
grant execute on function public.member_tier_of(uuid) to authenticated;

-- Quarterly Partners' evenings.
create table public.partner_events (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  title text not null,
  description text,
  capacity int not null default 40,
  created_at timestamptz not null default now()
);
create table public.partner_event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.partner_events(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  guests int not null default 0 check (guests between 0 and 2),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index partner_event_rsvps_key on public.partner_event_rsvps (event_id, membership_id);

grant select on public.partner_events to authenticated;
grant select on public.partner_event_rsvps to authenticated;
grant all on public.partner_events, public.partner_event_rsvps to service_role;
alter table public.partner_events enable row level security;
alter table public.partner_event_rsvps enable row level security;
create policy "members read events" on public.partner_events
  for select to authenticated using (true);
create policy "admin manage events" on public.partner_events
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "read own rsvp" on public.partner_event_rsvps
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.memberships m
               where m.id = membership_id and m.user_id = auth.uid())
  );

-- Every Stripe event we process, keyed by Stripe's event id so a redelivery
-- is a no-op rather than a double upgrade or a double receipt.
create table public.membership_events (
  stripe_event_id text primary key,
  type text not null,
  membership_id uuid references public.memberships(id) on delete set null,
  payload jsonb,
  processed_at timestamptz not null default now()
);
grant all on public.membership_events to service_role;
alter table public.membership_events enable row level security;
create policy "admin read events" on public.membership_events
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
