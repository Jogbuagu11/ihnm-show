import { createFileRoute, Link } from "@tanstack/react-router";
import panel from "@/assets/panel.jpg";
import sitdown from "@/assets/sitdown.jpg";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — IHNM Show" },
      { name: "description", content: "The mission and story of IHNM Show, a live-audience talk show on Scripture, history and current events, and the team behind it." },
      { property: "og:title", content: "About IHNM Show" },
      { property: "og:description", content: "Our mission, our story, and the people behind the show." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const team = [
  { n: "Host Name", r: "Host & Creator", b: "Placeholder bio — a few lines about the host, their background and why they started the show." },
  { n: "Producer Name", r: "Executive Producer", b: "Placeholder bio for the producer who keeps every taping on time." },
  { n: "Director Name", r: "Director", b: "Placeholder bio for the director behind the cameras." },
  { n: "Worship Lead", r: "Music & Worship", b: "Placeholder bio for the worship leader who opens each taping." },
];

function About() {
  return (
    <>
      <PageHeader image={panel} eyebrow="About" title="Why we gather">Scripture, history and today's headlines — talked through honestly, in front of a live audience.</PageHeader>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <p className="eyebrow">— Mission</p>
          <h2 className="display-lg">Truth, told <span className="italic-gold">together</span></h2>
          <p className="mt-4 text-lg text-muted-foreground">Placeholder mission statement: IHNM Show exists to bring Scripture and history to bear on the questions people are asking today — with warmth, rigor and a room full of neighbors.</p>
          <p className="eyebrow mt-10">— Our story</p>
          <p className="mt-3 text-muted-foreground">Placeholder story: how the show began, the first taping, and how Studio A in San Jose became home.</p>
        </div>
        <img src={sitdown} alt="Host in conversation with a guest on the IHNM set" width={1280} height={720} loading="lazy" className="frame-gold h-full w-full rounded-3xl object-cover" />
      </section>
      <section className="bg-stage text-stage-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow text-gold">— The team</p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((p) => <li key={p.n} className="border-t border-gold/40 pt-4"><p className="font-display text-2xl">{p.n}</p><p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{p.r}</p><p className="mt-2 text-sm text-stage-foreground/80">{p.b}</p></li>)}
          </ul>
          <div className="mt-10 flex gap-3"><Button asChild variant="gold"><Link to="/tickets">Join the audience</Link></Button><Button asChild variant="hero"><Link to="/contact">Contact us</Link></Button></div>
        </div>
      </section>
    </>
  );
}
