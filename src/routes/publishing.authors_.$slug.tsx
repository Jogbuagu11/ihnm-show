import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/publishing/cover";
import {
  IMPRINT,
  authorQuery,
  pubAsset,
  pubPath,
  pubSettingsQuery,
  pubUrl,
} from "@/lib/publishing";

export const Route = createFileRoute("/publishing/authors_/$slug")({
  head: () => ({ meta: [{ title: `Author — ${IMPRINT}` }] }),
  component: AuthorPage,
});

function AuthorPage() {
  const { slug } = Route.useParams();
  const { data: author, isLoading } = useQuery(authorQuery(slug));
  const { data: settings } = useQuery(pubSettingsQuery);

  if (isLoading)
    return <p className="mx-auto max-w-4xl px-4 py-20 text-muted-foreground">Loading…</p>;
  if (!author) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="display-lg">We couldn't find that author.</h1>
        <Button asChild variant="gold" className="mt-6">
          <Link to={pubPath("/authors")}>All authors</Link>
        </Button>
      </section>
    );
  }

  const photo = pubAsset(author.photo_path);
  const books = (author.books ?? [])
    .map((b) => b.book)
    .filter((b) => b && b.status === "published");
  const links = [
    { href: author.website_url, label: "Website" },
    { href: author.instagram_url, label: "Instagram" },
    { href: author.x_url, label: "X" },
  ].filter((l) => l.href);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    ...(author.bio ? { description: author.bio } : {}),
    ...(photo ? { image: photo } : {}),
    url: pubUrl(settings ?? undefined, `/authors/${author.slug}`),
    ...(links.length ? { sameAs: links.map((l) => l.href) } : {}),
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        to={pubPath("/authors")}
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-persimmon"
      >
        ← All authors
      </Link>

      <header className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center">
        {photo ? (
          <img
            src={photo}
            alt={author.name}
            className="size-40 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-40 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-6xl text-gold">
            {author.name.charAt(0)}
          </span>
        )}
        <div>
          <h1 className="display-lg">{author.name}</h1>
          {author.bio && <p className="mt-4 max-w-prose text-muted-foreground">{author.bio}</p>}
          {links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3">
              {links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-walnut underline underline-offset-4 hover:text-persimmon"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {books.length > 0 && (
        <section className="mt-14">
          <p className="eyebrow">— Books</p>
          <ul className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {books.map((b) => (
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
