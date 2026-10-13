import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import studio from "@/assets/studio.jpg";
import audience from "@/assets/audience.jpg";
import worship from "@/assets/worship.jpg";
import panel from "@/assets/panel.jpg";
import { Button } from "@/components/ui/button";
import { TapingCard } from "@/components/taping-card";
import { OnAir, Ticker } from "@/components/ticker";
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

const acts = [
  { n: "I", t: "Scripture", d: "We open the text — what it says, and what it meant to the people who first heard it.", img: worship },
  { n: "II", t: "History", d: "We walk the centuries in between: empires, councils, revivals and the stories that shaped us.", img: panel },
  { n: "III", t: "Today", d: "We land on this week's headlines, with expert guests and your questions from the audience.", img: audience },
];

function Home() {
  const { data: tapings } = useQuery(upcomingTapingsQuery);
  const { data: episodes } = useQuery(episodesQuery);
  const next = tapings?.[0];
  const latest = episodes?.[0];
  const embed = youtubeEmbed(latest?.youtube_url);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-stage text-stage-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 lg:grid-cols-12 lg:pt-16">
          <div className="flex items-center justify-between lg:col-span-12">
            <OnAir label="Now taping · Season 1" />
            <p className="hidden font-mono text-xs uppercase tracking-[0.25em] text-stage-foreground/60 sm:block">Studio A — San Jose</p>
          </div>
          <div className="relative z-10 lg:col-span-7 lg:pt-10">
            <h1 className="display-xl">
              IHNM<br />
              <span className="italic-gold">Show</span>
            </h1>
            <div className="rule-gold mt-8 max-w-md" />
            <p className="mt-6 font-display text-2xl italic text-stage-foreground/90 md:text-3xl">
              Scripture. History. <span className="text-gold">Today's Headlines.</span>
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg"><Link to="/tickets">Get Tickets</Link></Button>
              <Button asChild variant="hero" size="lg"><Link to="/watch">Watch Episodes</Link></Button>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <div className="arch frame-gold relative overflow-hidden rounded-b-[2rem]">
              <img src={studio} alt="The IHNM Show studio set" width={1600} height={912} className="aspect-[4/5] w-full object-cover object-[62%_center]" />
            </div>
            <p className="absolute -bottom-3 -left-3 rotate-[-4deg] rounded-full bg-blush px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-blush-foreground shadow-soft">
              Free seats · 20 per taping
            </p>
          </div>
        </div>
      </section>

      <Ticker />

      <section className="mx-auto mt-20 grid max-w-7xl gap-10 px-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">— 01 / Next taping</p>
          <div className="mt-5">
            {next ? <TapingCard t={next} featured /> : <div className="rounded-3xl border bg-card p-6">New tapings coming soon.</div>}
          </div>
        </div>
        <div className="lg:col-span-7">
          <p className="eyebrow">— 02 / Latest episode</p>
          <h2 className="display-lg mt-4">{latest?.title ?? "Loading…"}</h2>
          <div className="frame-gold mt-6 aspect-video overflow-hidden rounded-2xl bg-stage">
            {embed && <iframe src={embed} title={latest?.title} className="size-full" allowFullScreen loading="lazy" />}
          </div>
          {latest && <Link to="/watch/$slug" params={{ slug: latest.slug }} className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-walnut hover:text-gold">Episode details →</Link>}
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-7xl px-4">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow">— 03 / The show</p>
            <h2 className="display-lg mt-4">One conversation.<br /><span className="italic-gold">Three thousand</span> years.</h2>
          </div>
          <p className="text-lg text-muted-foreground lg:col-span-5">
            Every episode moves in three acts — in front of a live audience, with worship and expert guests.
          </p>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
          {acts.map((a) => (
            <article key={a.n} className="group bg-card p-6">
              <div className="overflow-hidden rounded-2xl">
                <img src={a.img} alt="" loading="lazy" width={1280} height={720} className="aspect-[4/3] w-full object-cover grayscale-[40%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
              </div>
              <p className="mt-6 font-display text-6xl italic text-gold">{a.n}</p>
              <h3 className="mt-1 text-3xl">{a.t}</h3>
              <p className="mt-3 text-muted-foreground">{a.d}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
