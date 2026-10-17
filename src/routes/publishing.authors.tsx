import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IMPRINT, authorsQuery, pubAsset, pubPath } from "@/lib/publishing";

export const Route = createFileRoute("/publishing/authors")({
  head: () => ({
    meta: [
      { title: `Authors — ${IMPRINT}` },
      { name: "description", content: `The writers published by ${IMPRINT}.` },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Authors,
});

function Authors() {
  const { data: authors = [], isLoading } = useQuery(authorsQuery);
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <p className="eyebrow">— Our writers</p>
      <h1 className="display-lg mt-4">Authors</h1>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : authors.length === 0 ? (
        <p className="mt-10 text-muted-foreground">Our first authors are being signed now.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {authors.map((a) => {
            const photo = pubAsset(a.photo_path);
            return (
              <li key={a.id} className="text-center">
                <Link to={pubPath(`/authors/${a.slug}`)} className="group block">
                  {photo ? (
                    <img
                      src={photo}
                      alt={a.name}
                      loading="lazy"
                      className="mx-auto aspect-square w-full max-w-[12rem] rounded-full object-cover transition group-hover:-translate-y-1"
                    />
                  ) : (
                    <span className="mx-auto flex aspect-square w-full max-w-[12rem] items-center justify-center rounded-full bg-gold/15 font-display text-5xl text-gold transition group-hover:-translate-y-1">
                      {a.name.charAt(0)}
                    </span>
                  )}
                  <p className="mt-4 font-display text-xl">{a.name}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
