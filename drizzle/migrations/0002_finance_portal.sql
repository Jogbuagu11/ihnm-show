create table public.finance_settings (
  id int primary key default 1 check (id=1),
  fundraising_goal_cents int not null default 2100000,
  monthly_operating_cents int not null default 0
);
insert into public.finance_settings(id) values (1);

create table public.campaigns (id uuid primary key default gen_random_uuid(), name text not null, description text, goal_cents int not null default 0, active boolean not null default true, created_at timestamptz not null default now());
create table public.partners (id uuid primary key default gen_random_uuid(), user_id uuid, name text not null, email text, amount_cents int not null default 0, frequency text not null default 'monthly', start_date date not null default current_date, status text not null default 'active', campaign_id uuid references public.campaigns(id) on delete set null, created_at timestamptz not null default now());
create table public.sponsors (id uuid primary key default gen_random_uuid(), business text not null, contact text, email text, package text, price_cents int not null default 0, start_date date, end_date date, status text not null default 'active', agreement_path text, created_at timestamptz not null default now());
create table public.sponsor_deliverables (id uuid primary key default gen_random_uuid(), sponsor_id uuid not null references public.sponsors(id) on delete cascade, episode_id uuid references public.episodes(id) on delete set null, mention_made boolean not null default false, logo_shown boolean not null default false, clip_posted boolean not null default false, notes text, created_at timestamptz not null default now());
create table public.invoices (id uuid primary key default gen_random_uuid(), number text not null default ('INV-' || to_char(now(),'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,4)), client_name text not null, email text, kind text not null default 'sponsor', description text, amount_cents int not null default 0, issued_on date not null default current_date, due_on date not null default (current_date + 14), status text not null default 'draft', pay_url text, paid_on date, created_at timestamptz not null default now());
create table public.rentals (id uuid primary key default gen_random_uuid(), renter text not null, email text, phone text, starts_at timestamptz not null, ends_at timestamptz not null, rate_type text not null default 'hourly', rate_cents int not null default 0, deposit_cents int not null default 0, deposit_paid boolean not null default false, agreement_path text, invoice_id uuid references public.invoices(id) on delete set null, notes text, status text not null default 'booked', created_at timestamptz not null default now());
create table public.income (id uuid primary key default gen_random_uuid(), stream text not null, amount_cents int not null, received_on date not null default current_date, memo text, partner_id uuid references public.partners(id) on delete set null, sponsor_id uuid references public.sponsors(id) on delete set null, campaign_id uuid references public.campaigns(id) on delete set null, invoice_id uuid references public.invoices(id) on delete set null, created_at timestamptz not null default now());
create table public.expenses (id uuid primary key default gen_random_uuid(), category text not null, amount_cents int not null, spent_on date not null default current_date, vendor text, memo text, receipt_path text, created_at timestamptz not null default now());
create table public.budgets (category text primary key, monthly_cents int not null default 0);
insert into public.budgets(category) values ('rent'),('utilities'),('insurance'),('equipment'),('shuttle'),('hospitality'),('ads'),('software'),('supplies');

do $$ declare t text; begin
  foreach t in array array['finance_settings','campaigns','partners','sponsors','sponsor_deliverables','invoices','rentals','income','expenses','budgets'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin all %s" on public.%I for all to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))', t, t);
  end loop;
end $$;

create policy "giver reads own" on public.partners for select to authenticated using (user_id = auth.uid());

create or replace function public.cancel_my_giving(_partner uuid) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.partners set status='canceled' where id=_partner and user_id=auth.uid() and status <> 'canceled';
  if not found then raise exception 'Gift not found'; end if;
end $$;

-- Private finance files bucket policies (bucket created separately)
create policy "admin read finance files" on storage.objects for select to authenticated using (bucket_id='finance' and public.has_role(auth.uid(),'admin'));
create policy "admin write finance files" on storage.objects for insert to authenticated with check (bucket_id='finance' and public.has_role(auth.uid(),'admin'));
create policy "admin delete finance files" on storage.objects for delete to authenticated using (bucket_id='finance' and public.has_role(auth.uid(),'admin'));