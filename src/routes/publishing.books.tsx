import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BookCover } from "@/components/publishing/cover";
import {
  CATEGORIES,
  FORMATS,
  IMPRINT,
  booksQuery,
  categoryLabel,
  pubPath,
  type PubCategory,
  type PubFormat,
} from "@/lib/publishing";
import { supabase } from "@/integrations/supabase/client";

export const pubBooksHead = () => ({
  meta: [
    { title: `Books — ${IMPRINT}` },
    {
      name: "description",
      content:
        "Our catalogue of faith, history and Christian living titles, in paperback, hardcover, ebook and audiobook.",
    },
    { property: "og:title", content: `Books — ${IMPRINT}` },
    { property: "og:type", content: "website" },
  ],
});

export const Route = createFileRoute("/publishing/books")({
  head: pubBooksHead,
  component: Books,
});

export function Books() {
  const { data: books = [], isLoading } = useQuery(booksQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<PubCategory | "all">("all");
  const [fmt, setFmt] = useState<PubFormat | "all">("all");

  // Format lives on a separate table, so the filter needs its own lookup.
  const { data: formatRows = [] } = useQuery({
    queryKey: ["pub_formats_all"],
    queryFn: async () => {
      const { data } = await supabase.from("pub_book_formats").select("book_id, format");
      return data ?? [];
    },
  });

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const withFormat = new Set(
      formatRows.filter((r) => fmt === "all" || r.format === fmt).map((r) => r.book_id),
    );
    return books
      .filter((b) => b.status === "published")
      .filter((b) => cat === "all" || b.category === cat)
      .filter((b) => fmt === "all" || withFormat.has(b.id))
      .filter((b) => {
        if (!needle) return true;
        const authors = (b.authors ?? []).map((a) => a.author?.name ?? "").join(" ");
        return `${b.title} ${b.subtitle ?? ""} ${authors}`.toLowerCase().includes(needle);
      });
  }, [books, q, cat, fmt, formatRows]);

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] transition ${
      active
        ? "border-gold bg-gold/15 text-walnut"
        : "border-input text-muted-foreground hover:border-gold"
    }`;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <p className="eyebrow">— Catalogue</p>
      <h1 className="display-lg mt-4">Our books</h1>

      <div className="mt-8 space-y-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Search by title or author"
            aria-label="Search books"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button className={chip(cat === "all")} onClick={() => setCat("all")}>
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.value} className={chip(cat === c.value)} onClick={() => setCat(c.value)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by format">
          <button className={chip(fmt === "all")} onClick={() => setFmt("all")}>
            All formats
          </button>
          {FORMATS.map((f) => (
            <button key={f.value} className={chip(fmt === f.value)} onClick={() => setFmt(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-12 text-muted-foreground">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          No books match that. Try clearing the filters.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((b) => (
            <li key={b.id}>
              <Link to={pubPath(`/books/${b.slug}`)} className="group block">
                <BookCover book={b} className="transition group-hover:-translate-y-1" />
                <p className="mt-3 font-display text-lg leading-tight">{b.title}</p>
                {b.authors?.[0]?.author && (
                  <p className="text-sm text-muted-foreground">{b.authors[0].author.name}</p>
                )}
                <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-gold">
                  {categoryLabel(b.category)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
