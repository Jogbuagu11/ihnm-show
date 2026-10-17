-- Sample catalogue so the site has something to show before real titles exist.
-- Clearly fictional: these are placeholders, not claims about books we have.

insert into public.pub_settings (id, royalty_rate_pct, contract_term_years, response_weeks)
values (1, 15.00, 7, 8)
on conflict (id) do update set
  royalty_rate_pct = excluded.royalty_rate_pct,
  contract_term_years = excluded.contract_term_years;

insert into public.pub_authors (slug, name, bio) values
  ('sample-author-one', 'A. Sample Author',
   'Sample author biography. Replace this with a real author when the first title is signed.'),
  ('sample-author-two', 'B. Sample Author',
   'Sample author biography. Replace this with a real author when the first title is signed.')
on conflict (slug) do nothing;

insert into public.pub_books (slug, title, subtitle, description, category, status, featured, release_date, page_count)
values
  ('sample-title-one', 'Sample Title One', 'A placeholder subtitle',
   'Sample description. This is placeholder catalogue copy and will be replaced by a real title.',
   'faith', 'published', true, '2027-04-01', 248),
  ('sample-title-two', 'Sample Title Two', 'A placeholder subtitle',
   'Sample description. This is placeholder catalogue copy and will be replaced by a real title.',
   'history', 'published', false, '2027-06-01', 312),
  ('sample-title-three', 'Sample Title Three', 'A placeholder subtitle',
   'Sample description. This is placeholder catalogue copy and will be replaced by a real title.',
   'christian_living', 'coming_soon', false, '2027-09-01', 196)
on conflict (slug) do nothing;

insert into public.pub_book_authors (book_id, author_id)
select b.id, a.id from public.pub_books b, public.pub_authors a
where (b.slug, a.slug) in (
  ('sample-title-one', 'sample-author-one'),
  ('sample-title-two', 'sample-author-two'),
  ('sample-title-three', 'sample-author-one'))
on conflict do nothing;

insert into public.pub_book_formats (book_id, format, isbn)
select b.id, f.format, f.isbn from public.pub_books b
join (values
  ('sample-title-one', 'paperback'::public.pub_format, '978-1-0000000-0-1'),
  ('sample-title-one', 'ebook',                        '978-1-0000000-0-2'),
  ('sample-title-two', 'paperback',                    '978-1-0000000-1-1'),
  ('sample-title-two', 'hardcover',                    '978-1-0000000-1-2'),
  ('sample-title-three', 'paperback',                  '978-1-0000000-2-1')
) as f(slug, format, isbn) on f.slug = b.slug
on conflict (book_id, format) do nothing;

insert into public.pub_endorsements (book_id, quote, source)
select b.id, 'A sample endorsement quote, to be replaced with a real one.', 'Sample Reviewer'
from public.pub_books b where b.slug = 'sample-title-one';

insert into public.pub_submissions
  (name, email, book_title, category, word_count, manuscript_status, pitch,
   rights_confirmed, terms_confirmed, status)
values
  ('Sample Writer One','writer1@example.com','A Sample Manuscript','faith',62000,'complete',
   'Sample pitch paragraph.',true,true,'new'),
  ('Sample Writer Two','writer2@example.com','Another Sample','history',48000,'in_progress',
   'Sample pitch paragraph.',true,true,'reading'),
  ('Sample Writer Three','writer3@example.com','A Third Sample','christian_living',71000,'complete',
   'Sample pitch paragraph.',true,true,'request_full'),
  ('Sample Writer Four','writer4@example.com','A Fourth Sample','faith',55000,'complete',
   'Sample pitch paragraph.',true,true,'declined');
