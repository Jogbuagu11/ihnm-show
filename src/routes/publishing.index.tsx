import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Copyright, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/publishing/cover";
import {
  IMPRINT,
  TAGLINE,
  authorsQuery,
  booksQuery,
  categoryLabel,
  pubAsset,
  pubPath,
  pubSettingsQuery,
} from "@/lib/publishing";

export const pubHomeHead = () => ({
  meta: [
    { title: `${IMPRINT} — ${TAGLINE}` },
    {
      name: "description",
      content:
        "An independent Christian publisher of faith, history and Christian living. We pay for editing, cover and distribution; authors pay nothing and keep their copyright.",
    },
    { property: "og:title", content: IMPRINT },
    { property: "og:description", content: TAGLINE },
    { property: "og:type", content: "website" },
  ],
});

export const Route = createFileRoute("/publishing/")({
  head: pubHomeHead,
  component: PubHome,
});

const WHY = [
  {
    icon: BookOpen,
    t: "We invest in your book",
    b: "We pay for editing, cover design, layout and distribution. Authors pay nothing to publish and earn royalties.",
  },
  {
    icon: Copyright,
    t: "You keep your copyright",
    b: "The work stays yours. We license the right to publish it, we do not take ownership of it.",
  },
  {
    icon: Mic,
    t: "Every book launches on IHNM Show",
    b: "An author interview, a live-audience book signing, clips for social, and a feature in the newsletter.",
  },
];

export function PubHome() {
  const { data: settings } = useQuery(pubSettingsQuery);
  const { data: books = [] } = useQuery(booksQuery);
  const { data: authors = [] } = useQuery(authorsQuery);

  const published = books.filter((b) => b.status === "published");
  const featured = published.find((b) => b.featured) ?? published[0];
  const latest = published.filter((b) => b.id !== featured?.id).slice(0, 6);
  const spotlight = authors[0];

  return (
    <>
      <section className="border-b border-gold/20 bg-daylight">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <p className="eyebrow">— {IMPRINT}</p>
          <h1 className="display-xl mt-5 text-walnut">
            Timeless truth.
            <br />
            <span className="italic-gold">Today's world.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            An independent Christian publisher of faith, history and Christian living.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link to={pubPath("/submit")}>Submit your manuscript</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={pubPath("/books")}>Browse our books</Link>
            </Button>
          </div>
        </div>
      </section>

      {featured && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="eyebrow">— New release</p>
          <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,14rem)_1fr] md:items-center">
            <Link to={pubPath(`/books/${featured.slug}`)} className="block max-w-[14rem]">
              <BookCover book={featured} />
            </Link>
            <div>
              <h2 className="display-lg">{featured.title}</h2>
              {featured.subtitle && (
                <p className="mt-2 font-display text-xl italic text-gold">{featured.subtitle}</p>
              )}
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {categoryLabel(featured.category)}
                {featured.authors?.[0]?.author && ` · ${featured.authors[0].author.name}`}
              </p>
              {featured.description && (
                <p className="mt-5 max-w-prose text-muted-foreground">{featured.description}</p>
              )}
              <Button asChild variant="gold" className="mt-7">
                <Link to={pubPath(`/books/${featured.slug}`)}>Read more</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow">— Why publish with us</p>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {WHY.map(({ icon: Icon, t, b }) => (
              <li key={t} className="rounded-3xl border bg-white p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-2xl">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">— Latest titles</p>
            <Link
              to={pubPath("/books")}
              className="font-mono text-xs uppercase tracking-[0.2em] text-walnut hover:text-persimmon"
            >
              All books →
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {latest.map((b) => (
              <li key={b.id}>
                <Link to={pubPath(`/books/${b.slug}`)} className="group block">
                  <BookCover book={b} className="transition group-hover:-translate-y-1" />
                  <p className="mt-3 font-display text-base leading-tight">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.authors?.[0]?.author?.name ?? categoryLabel(b.category)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {spotlight && (
        <section className="bg-secondary/50">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-16 text-center sm:flex-row sm:text-left">
            {pubAsset(spotlight.photo_path) ? (
              <img
                src={pubAsset(spotlight.photo_path)!}
                alt={spotlight.name}
                className="size-32 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex size-32 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-4xl text-gold">
                {spotlight.name.charAt(0)}
              </span>
            )}
            <div>
              <p className="eyebrow">— Author spotlight</p>
              <h2 className="display-lg mt-3">{spotlight.name}</h2>
              {spotlight.bio && <p className="mt-3 text-muted-foreground">{spotlight.bio}</p>}
              <Link
                to={pubPath(`/authors/${spotlight.slug}`)}
                className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-walnut hover:text-persimmon"
              >
                Read more →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
        <p className="eyebrow">— Newsletter</p>
        <h2 className="display-lg mt-4">New titles, first</h2>
        <p className="mt-3 text-muted-foreground">
          Cover reveals, release dates and author interviews, in the weekly IHNM newsletter.
        </p>
        {settings?.substack_url ? (
          <Button asChild variant="gold" className="mt-6">
            <a href={settings.substack_url} target="_blank" rel="noopener noreferrer">
              Read the newsletter
            </a>
          </Button>
        ) : (
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Launching soon
          </p>
        )}
      </section>
    </>
  );
}
