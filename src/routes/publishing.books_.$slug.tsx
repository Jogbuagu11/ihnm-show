import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/publishing/cover";
import { youtubeEmbed } from "@/lib/show";
import {
  BUY_LINKS,
  IMPRINT,
  bookQuery,
  booksQuery,
  categoryLabel,
  formatLabel,
  pubAsset,
  pubPath,
  pubSettingsQuery,
  pubUrl,
} from "@/lib/publishing";

export const Route = createFileRoute("/publishing/books_/$slug")({
  head: () => ({
    meta: [{ title: `Book — ${IMPRINT}` }],
  }),
  component: BookPage,
});

function BookPage() {
  const { slug } = Route.useParams();
  const { data: book, isLoading } = useQuery(bookQuery(slug));
  const { data: settings } = useQuery(pubSettingsQuery);
  const { data: all = [] } = useQuery(booksQuery);

  if (isLoading)
    return <p className="mx-auto max-w-4xl px-4 py-20 text-muted-foreground">Loading…</p>;
  if (!book) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="display-lg">We couldn't find that book.</h1>
        <Button asChild variant="gold" className="mt-6">
          <Link to={pubPath("/books")}>Browse the catalogue</Link>
        </Button>
      </section>
    );
  }

  const authors = (book.authors ?? []).map((a) => a.author).filter(Boolean);
  const embed = youtubeEmbed(book.youtube_url);
  const sample = pubAsset(book.sample_pdf_path);
  const buyLinks = (book.buy_links ?? {}) as Record<string, string>;
  const related = all
    .filter((b) => b.status === "published" && b.id !== book.id && b.category === book.category)
    .slice(0, 4);

  // schema.org Book, so search engines and retailers read the catalogue properly.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    ...(book.description ? { description: book.description } : {}),
    ...(authors.length
      ? { author: authors.map((a) => ({ "@type": "Person", name: a!.name })) }
      : {}),
    publisher: { "@type": "Organization", name: IMPRINT },
    ...(book.release_date ? { datePublished: book.release_date } : {}),
    ...(book.page_count ? { numberOfPages: book.page_count } : {}),
    ...(book.formats?.length ? { isbn: book.formats.find((f) => f.isbn)?.isbn ?? undefined } : {}),
    url: pubUrl(settings ?? undefined, `/books/${book.slug}`),
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        to={pubPath("/books")}
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-persimmon"
      >
        ← All books
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,16rem)_1fr]">
        <div className="max-w-[16rem]">
          <BookCover book={book} />
          {sample && (
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <a href={sample} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" aria-hidden /> Read a sample
              </a>
            </Button>
          )}
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
            {categoryLabel(book.category)}
            {book.status === "coming_soon" && " · Coming soon"}
          </p>
          <h1 className="display-lg mt-3">{book.title}</h1>
          {book.subtitle && (
            <p className="mt-2 font-display text-xl italic text-gold">{book.subtitle}</p>
          )}

          {authors.length > 0 && (
            <p className="mt-4 text-muted-foreground">
              by{" "}
              {authors.map((a, i) => (
                <span key={a!.id}>
                  {i > 0 && ", "}
                  <Link
                    to={pubPath(`/authors/${a!.slug}`)}
                    className="text-walnut underline underline-offset-4 hover:text-persimmon"
                  >
                    {a!.name}
                  </Link>
                </span>
              ))}
            </p>
          )}

          {book.description && (
            <p className="mt-6 max-w-prose whitespace-pre-line text-muted-foreground">
              {book.description}
            </p>
          )}

          {Object.keys(buyLinks).length > 0 ? (
            <>
              <p className="eyebrow mt-9">— Where to buy</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {BUY_LINKS.filter((l) => buyLinks[l.key]).map((l) => (
                  <Button key={l.key} asChild variant="outline" size="sm">
                    <a href={buyLinks[l.key]} target="_blank" rel="noopener noreferrer">
                      {l.label} <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Or ask your local bookstore to order it — they can, and it helps them.
              </p>
            </>
          ) : (
            <p className="mt-9 text-sm text-muted-foreground">
              Retail links go up closer to release. Ask your local bookstore to order it when it
              lands — they can.
            </p>
          )}

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-gold/30 pt-6 text-sm sm:grid-cols-3">
            {book.page_count && (
              <div>
                <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                  Pages
                </dt>
                <dd>{book.page_count}</dd>
              </div>
            )}
            {book.release_date && (
              <div>
                <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                  Released
                </dt>
                <dd>{book.release_date}</dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                Publisher
              </dt>
              <dd>{IMPRINT}</dd>
            </div>
            {(book.formats ?? []).map((f) => (
              <div key={f.id}>
                <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                  {formatLabel(f.format)}
                </dt>
                <dd className="tabular-nums">{f.isbn ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {(book.endorsements ?? []).length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">— Praise</p>
          <ul className="mt-5 grid gap-5 md:grid-cols-2">
            {book.endorsements.map((e) => (
              <li key={e.id} className="rounded-3xl border bg-white p-6">
                <p className="font-display text-lg italic">“{e.quote}”</p>
                <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                  {e.source}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {embed && (
        <section className="mt-16">
          <p className="eyebrow">— The author on IHNM Show</p>
          <div className="frame-gold mt-5 aspect-video overflow-hidden rounded-2xl bg-stage">
            <iframe
              src={embed}
              title={`${book.title} — author interview`}
              className="size-full"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">— More {categoryLabel(book.category)}</p>
          <ul className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {related.map((b) => (
              <li key={b.id}>
                <Link to={pubPath(`/books/${b.slug}`)} className="group block">
                  <BookCover book={b} className="transition group-hover:-translate-y-1" />
                  <p className="mt-2 font-display text-base leading-tight">{b.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
