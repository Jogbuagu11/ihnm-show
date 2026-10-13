import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Landmark, Newspaper } from "lucide-react";
import studio from "@/assets/studio.jpg";
import audience from "@/assets/audience.jpg";
import worship from "@/assets/worship.jpg";
import { Button } from "@/components/ui/button";
import { TapingCard } from "@/components/taping-card";
import { episodesQuery, upcomingTapingsQuery } from "@/lib/queries";
import { youtubeEmbed } from "@/lib/show";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IHNM Show — Scripture. History. Today's Headlines." },
      { name: "description", content: "Join the live studio audience for IHNM Show at Studio A, San Jose. Get free tickets and watch the latest episodes." },
      { property: "og:title", content: "IHNM Show — Live-audience talk show" },
      { property: "og:description", content: "Scripture. History. Today's Headlines. Get tickets and watch episodes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: tapings } = useQuery(upcomingTapingsQuery);
  const { data: episodes } = useQuery(episodesQuery);
  const next = tapings?.[0];
  const latest = episodes?.[0];
  const embed = youtubeEmbed(latest?.youtube_url);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={studio} alt="The IHNM Show studio set" width={1600} height={912} className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-32 text-ivory">
          <p className="eyebrow text-gold">Live studio audience · San Jose</p>
          <h1 className="mt-3 text-6xl font-semibold leading-none sm:text-8xl">IHNM Show</h1>
          <p className="mt-4 max-w-xl text-xl opacity-95 sm:text-2xl">Scripture. History. Today's Headlines.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg"><Link to="/tickets">Get Tickets</Link></Button>
            <Button asChild variant="hero" size="lg"><Link to="/watch">Watch Episodes</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-6xl gap-8 px-4 md:grid-cols-5">
        <div className="md:col-span-2">
          {next ? <TapingCard t={next} featured /> : <div className="rounded-3xl border bg-card p-6 shadow-soft">New tapings coming soon.</div>}
        </div>
        <div className="md:col-span-3 md:pt-16">
          <p className="eyebrow">Latest episode</p>
          <h2 className="mt-1 text-3xl font-semibold">{latest?.title ?? "Loading…"}</h2>
          <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-muted shadow-soft">
            {embed && <iframe src={embed} title={latest?.title} className="size-full" allowFullScreen loading="lazy" />}
          </div>
          {latest && <Link to="/watch/$slug" params={{ slug: latest.slug }} className="mt-3 inline-block text-sm font-semibold text-walnut underline-offset-4 hover:underline">Episode details →</Link>}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">About the show</p>
            <h2 className="mt-2 text-4xl font-semibold leading-tight">One conversation. Three thousand years.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Each episode follows a single thread — from Scripture, through history, to today's headlines — in front of a live audience, with worship and expert guests.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[{ i: BookOpen, t: "Scripture" }, { i: Landmark, t: "History" }, { i: Newspaper, t: "Today" }].map(({ i: Icon, t }) => (
                <div key={t} className="rounded-2xl bg-secondary p-4">
                  <Icon className="size-5 text-gold" />
                  <p className="mt-2 font-display text-lg font-semibold">{t}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={audience} alt="Studio audience applauding" loading="lazy" width={1280} height={720} className="arch aspect-[3/4] w-full rounded-b-2xl object-cover shadow-soft" />
            <img src={worship} alt="Worship team on stage" loading="lazy" width={1280} height={720} className="arch mt-10 aspect-[3/4] w-full rounded-b-2xl object-cover shadow-soft" />
          </div>
        </div>
      </section>
    </>
  );
}
