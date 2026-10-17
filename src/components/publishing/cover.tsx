import { pubAsset, type PubBook } from "@/lib/publishing";

/** Real cover when one is uploaded; otherwise a typographic stand-in rather
 *  than a broken image or a grey box. Deterministic per slug, so a given book
 *  always looks the same. */
export function BookCover({
  book,
  className = "",
  sizes,
}: {
  book: Pick<PubBook, "slug" | "title" | "cover_path">;
  className?: string;
  sizes?: string;
}) {
  const src = pubAsset(book.cover_path);
  if (src) {
    return (
      <img
        src={src}
        alt={`Cover of ${book.title}`}
        loading="lazy"
        sizes={sizes}
        className={`aspect-[2/3] w-full rounded-sm object-cover shadow-soft ${className}`}
      />
    );
  }

  const hue = [...book.slug].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 3;
  const grounds = [
    "from-[#2b2520] to-[#4a3b2a]",
    "from-[#3a2a24] to-[#7a5a36]",
    "from-[#241e1a] to-[#5c4630]",
  ];
  return (
    <div
      role="img"
      aria-label={`Placeholder cover for ${book.title}`}
      className={`flex aspect-[2/3] w-full flex-col justify-between rounded-sm bg-gradient-to-br ${grounds[hue]} p-5 shadow-soft ring-1 ring-gold/25 ${className}`}
    >
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-gold/80">
        IHNM Publishing
      </span>
      <span className="font-display text-xl leading-tight text-[#faf6ec] sm:text-2xl">
        {book.title}
      </span>
      <span className="h-px w-10 bg-gold/70" />
    </div>
  );
}
