-- IHNM Publishing House. Shares the database and the admin role with the show
-- site; everything is prefixed pub_ so the two never collide.

create type public.pub_category as enum ('faith', 'history', 'christian_living');
create type public.pub_format as enum ('paperback', 'hardcover', 'ebook', 'audiobook');
create type public.pub_book_status as enum ('coming_soon', 'published');
create type public.pub_manuscript_status as enum ('complete', 'in_progress');
create type public.pub_submission_status as enum
  ('new', 'reading', 'request_full', 'offer_made', 'declined', 'signed');

-- One row. Holds the values the FAQ and the canonical tags read from, so the
-- domain move later is a setting rather than a search-and-replace.
create table public.pub_settings (
  id int primary key default 1 check (id = 1),
  site_url text not null default 'https://books.ihnmshow.com',
  royalty_rate_pct numeric(5,2),
  contract_term_years int,
  substack_url text,
  url_instagram text,
  url_facebook text,
  url_youtube text,
  response_weeks int not null default 8,
  created_at timestamptz not null default now()
);
insert into public.pub_settings(id) values (1);
grant select on public.pub_settings to anon, authenticated;
grant update on public.pub_settings to authenticated;
grant all on public.pub_settings to service_role;
alter table public.pub_settings enable row level security;
create policy "pub settings readable" on public.pub_settings
  for select to anon, authenticated using (true);
create policy "admin update pub settings" on public.pub_settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.pub_authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  photo_path text,
  bio text,
  website_url text,
  instagram_url text,
  x_url text,
  created_at timestamptz not null default now()
);

create table public.pub_books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  category public.pub_category not null default 'faith',
  cover_path text,
  page_count int,
  release_date date,
  status public.pub_book_status not null default 'coming_soon',
  featured boolean not null default false,
  -- The IHNM Show interview, once it exists.
  youtube_url text,
  sample_pdf_path text,
  -- Retailer links vary per title and some are added late, so they live in one
  -- editable object rather than a column each.
  buy_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index pub_books_status_idx on public.pub_books (status, release_date desc);
create index pub_books_category_idx on public.pub_books (category);
create index pub_books_featured_idx on public.pub_books (featured) where featured;

-- A book can have more than one author, and an author more than one book.
create table public.pub_book_authors (
  book_id uuid not null references public.pub_books(id) on delete cascade,
  author_id uuid not null references public.pub_authors(id) on delete cascade,
  sort_order int not null default 0,
  primary key (book_id, author_id)
);

-- ISBNs are per format, so they get their own rows.
create table public.pub_book_formats (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.pub_books(id) on delete cascade,
  format public.pub_format not null,
  isbn text,
  price_cents int,
  unique (book_id, format)
);

create table public.pub_endorsements (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.pub_books(id) on delete cascade,
  quote text not null,
  source text not null,
  sort_order int not null default 0
);

grant select on public.pub_authors, public.pub_books, public.pub_book_authors,
  public.pub_book_formats, public.pub_endorsements to anon, authenticated;
grant insert, update, delete on public.pub_authors, public.pub_books, public.pub_book_authors,
  public.pub_book_formats, public.pub_endorsements to authenticated;
grant all on public.pub_authors, public.pub_books, public.pub_book_authors,
  public.pub_book_formats, public.pub_endorsements to service_role;

alter table public.pub_authors enable row level security;
alter table public.pub_books enable row level security;
alter table public.pub_book_authors enable row level security;
alter table public.pub_book_formats enable row level security;
alter table public.pub_endorsements enable row level security;

-- Catalogue is public. Unpublished titles are visible to admins only, so a
-- forthcoming book cannot be found before it is announced.
create policy "books public" on public.pub_books for select to anon, authenticated
  using (status = 'published' or public.has_role(auth.uid(), 'admin'));
create policy "authors public" on public.pub_authors for select to anon, authenticated using (true);
create policy "book authors public" on public.pub_book_authors for select to anon, authenticated using (true);
create policy "formats public" on public.pub_book_formats for select to anon, authenticated using (true);
create policy "endorsements public" on public.pub_endorsements for select to anon, authenticated using (true);

create policy "admin books" on public.pub_books for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin authors" on public.pub_authors for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin book authors" on public.pub_book_authors for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin formats" on public.pub_book_formats for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin endorsements" on public.pub_endorsements for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Manuscript submissions. The manuscript itself goes to a private bucket; the
-- row only holds its path.
create table public.pub_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  book_title text not null,
  category public.pub_category not null,
  word_count int,
  manuscript_status public.pub_manuscript_status not null default 'complete',
  pitch text not null,
  synopsis text,
  author_bio text,
  platform text,
  file_path text,
  rights_confirmed boolean not null default false,
  terms_confirmed boolean not null default false,
  status public.pub_submission_status not null default 'new',
  admin_notes text,
  -- Declined manuscripts are deleted after six months, as the terms promise.
  purge_after date,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index pub_submissions_status_idx on public.pub_submissions (status, created_at desc);

grant insert on public.pub_submissions to anon, authenticated;
grant select, update, delete on public.pub_submissions to authenticated;
grant all on public.pub_submissions to service_role;
alter table public.pub_submissions enable row level security;

-- Anyone may submit, and both agreement boxes must be ticked. Nobody but an
-- admin may read one back: these are unpublished manuscripts.
create policy "anyone may submit" on public.pub_submissions
  for insert to anon, authenticated with check (
    rights_confirmed and terms_confirmed
    and length(name) between 1 and 120
    and length(email) between 3 and 255
    and length(book_title) between 1 and 200
    and length(pitch) between 1 and 2000
    and length(coalesce(synopsis, '')) <= 8000
    and length(coalesce(author_bio, '')) <= 4000
    and length(coalesce(platform, '')) <= 2000
    and status = 'new'
    and admin_notes is null
  );
create policy "admin reads submissions" on public.pub_submissions
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin manages submissions" on public.pub_submissions
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Covers, author photos and sample chapters are meant to be seen.
insert into storage.buckets (id, name, public) values ('publishing', 'publishing', true)
  on conflict (id) do nothing;
-- Manuscripts are not.
insert into storage.buckets (id, name, public) values ('manuscripts', 'manuscripts', false)
  on conflict (id) do nothing;

create policy "public read publishing" on storage.objects
  for select using (bucket_id = 'publishing');
create policy "admin write publishing" on storage.objects
  for all to authenticated
  using (bucket_id = 'publishing' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'publishing' and public.has_role(auth.uid(), 'admin'));

-- Writers upload their manuscript; only an admin can read one back.
create policy "anyone upload manuscript" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'manuscripts');
create policy "admin read manuscripts" on storage.objects
  for select to authenticated
  using (bucket_id = 'manuscripts' and public.has_role(auth.uid(), 'admin'));
create policy "admin delete manuscripts" on storage.objects
  for delete to authenticated
  using (bucket_id = 'manuscripts' and public.has_role(auth.uid(), 'admin'));
