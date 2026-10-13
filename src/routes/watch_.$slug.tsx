import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EpisodeCard } from "@/components/episode-card";
import { episodesQuery } from "@/lib/queries";
import { fmtShortDate, kindLabel, youtubeEmbed } from "@/lib/show";

export const Route = createFileRoute("/watch_/$slug")({
  loader: async ({ context, params }) => {
    const eps = await context.queryClient.ensureQueryData(episodesQuery);
    const ep = eps.find((e) => e.slug === params.slug);
    if (!ep) throw notFound();
    return { title: ep.title, description: ep.description ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — IHNM Show` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "video.episode" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Episode — IHNM Show" }, { name: "robots", content: "noindex" }],
  }),
  component: EpisodePage,
});

function EpisodePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(episodesQuery);
  const ep = data.find((e) => e.slug === slug)!;
  const embed = youtubeEmbed(ep.youtube_url);
  const related = data
    .filter((e) => e.id !== ep.id)
    .map((e) => ({ e, score: e.tags.filter((t) => ep.tags.includes(t)).length + e.guests.filter((g) => ep.guests.includes(g)).length + (e.kind === ep.kind ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/watch" className="text-sm font-semibold text-walnut">← All episodes</Link>
      <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-muted shadow-soft">
        {embed ? <iframe src={embed} title={ep.title} className="size-full" allowFullScreen /> : <p className="p-10">Video coming soon.</p>}
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="eyebrow">{kindLabel[ep.kind]} · {fmtShortDate(ep.aired_on + "T12:00:00Z")}</p>
          <h1 className="mt-2 text-4xl font-semibold">{ep.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{ep.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {ep.tags.map((t) => <span key={t} className="rounded-full bg-blush px-3 py-1 text-xs text-blush-foreground">{t}</span>)}
          </div>
        </div>
        <div className="rounded-2xl bg-secondary p-5">
          <p className="eyebrow">Guests</p>
          <ul className="mt-3 space-y-2 font-display text-lg">{ep.guests.map((g) => <li key={g}>{g}</li>)}</ul>
        </div>
      </div>
      <h2 className="mt-14 text-2xl font-semibold">Related episodes</h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map(({ e }) => <EpisodeCard key={e.id} ep={e} />)}
      </div>
    </div>
  );
}
