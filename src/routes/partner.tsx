import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import studio from "@/assets/studio.jpg";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner With Us — IHNM Show Sponsorship" },
      { name: "description", content: "Sponsor IHNM Show: audience reach, sponsorship packages, past partners and a downloadable media kit." },
      { property: "og:title", content: "Partner With IHNM Show" },
      { property: "og:description", content: "Put your business in front of a live studio audience and our online viewers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Partner,
});

const reach = [["—", "Live audience per taping"], ["—", "Monthly YouTube views"], ["—", "Newsletter subscribers"], ["—", "Social followers"]];
const packages = [
  { n: "Episode Supporter", p: "Placeholder price", f: ["On-air mention", "Logo on the episode page", "Thank-you post"] },
  { n: "Taping Partner", p: "Placeholder price", f: ["Everything in Supporter", "Logo on the next-taping card", "Booth or table at the taping", "Clip of your mention"] },
  { n: "Season Partner", p: "Placeholder price", f: ["Everything in Taping Partner", "Mentions all season", "Monthly recap of views and clips"] },
];

function Partner() {
  const { data: logos = [] } = useQuery({
    queryKey: ["past-sponsors"],
    queryFn: async () => {
      const [e, t] = await Promise.all([
        supabase.from("episodes").select("sponsor_name,sponsor_logo_url,sponsor_url").not("sponsor_name", "is", null),
        supabase.from("tapings").select("sponsor_name,sponsor_logo_url,sponsor_url").not("sponsor_name", "is", null),
      ]);
      const all = [...(e.data ?? []), ...(t.data ?? [])];
      return [...new Map(all.map((s) => [s.sponsor_name, s])).values()];
    },
  });
  return (
    <>
      <PageHeader image={studio} eyebrow="Sponsorship" title="Partner With Us">Support honest conversation about faith, history and today — and reach a room that's paying attention.</PageHeader>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="eyebrow">— Audience reach</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-4">{reach.map(([n, l]) => <li key={l} className="border-t border-gold pt-3"><p className="font-display text-5xl text-gold">{n}</p><p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">{l}</p></li>)}</ul>
        <p className="mt-2 text-xs text-muted-foreground">Numbers coming soon.</p>
      </section>
      <section className="bg-stage text-stage-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow text-gold">— Packages</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{packages.map((p) => <div key={p.n} className="rounded-3xl border border-gold/40 p-6"><p className="font-display text-2xl">{p.n}</p><p className="italic-gold text-lg">{p.p}</p><ul className="mt-3 space-y-1 text-sm text-stage-foreground/85">{p.f.map((x) => <li key={x}>✦ {x}</li>)}</ul></div>)}</div>
          <Button asChild variant="gold" className="mt-8"><a href="/ihnm-media-kit.pdf" download><Download className="size-4" aria-hidden /> Download media kit (PDF)</a></Button>
        </div>
      </section>
      {logos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <p className="eyebrow">— Past partners</p>
          <ul className="mt-4 flex flex-wrap items-center gap-8">{logos.map((s) => <li key={s.sponsor_name}>{s.sponsor_logo_url ? <img src={s.sponsor_logo_url} alt={`${s.sponsor_name} logo`} className="h-12 w-auto object-contain" loading="lazy" /> : <span className="font-display text-xl">{s.sponsor_name}</span>}</li>)}</ul>
        </section>
      )}
      <section className="bg-secondary"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[1fr_1.4fr]">
        <div><p className="eyebrow">— Let's talk</p><h2 className="display-lg">Sponsor <span className="italic-gold">inquiry</span></h2><p className="mt-3 text-muted-foreground">Tell us about your business and we'll send packages and dates.</p></div>
        <ContactForm topic="sponsors" cta="Send sponsor inquiry" />
      </div></section>
    </>
  );
}
