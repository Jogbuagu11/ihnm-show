import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import studio from "@/assets/studio.jpg";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery, mediaKitUrl } from "@/lib/settings";
import { trackMediaKitDownload } from "@/lib/analytics";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner With Us — IHNM Show Sponsorship" },
      {
        name: "description",
        content:
          "Sponsor IHNM Show: audience reach, sponsorship packages, past partners and a downloadable media kit.",
      },
      { property: "og:title", content: "Partner With IHNM Show" },
      {
        property: "og:description",
        content: "Put your business in front of a live studio audience and our online viewers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Partner,
});

const reach = [
  ["—", "Live audience per taping"],
  ["—", "Monthly YouTube views"],
  ["—", "Newsletter subscribers"],
  ["—", "Social followers"],
];
const packages = [
  {
    n: "Episode Sponsor",
    standard: "$500/month",
    founding: "$250/month",
    f: "Name and logo in every episode that month, link in each YouTube description, 1 dedicated clip, thank-you in the newsletter",
  },
  {
    n: "Segment Sponsor",
    standard: "$350/month",
    founding: "$200/month",
    f: "Name on one recurring part of the show (for example, the audience Q&A), logo on screen during that part, description link",
  },
  {
    n: "Special Presenting Sponsor",
    standard: "$1,000 per Special",
    founding: "$500 per Special",
    f: "“Presented by” billing on the monthly live Special, mentions at open and close, logo on the livestream, 2 dedicated clips",
  },
  {
    n: "Newsletter Feature",
    standard: "$10/week",
    founding: "$10/week",
    f: "One product or book featured in that week’s email, marked Sponsored",
  },
];

// Businesses can partner with goods or services instead of cash.
const inKind = [
  {
    n: "Wardrobe Partner",
    provide: "Outfits or jewelry for the host, gifted or loaned",
    receive:
      "“Wardrobe provided by” credit on screen, tags on YouTube and social, professional photos of the look",
  },
  {
    n: "Refreshments Partner",
    provide: "Coffee, pastries or light food for each recording",
    receive: "On-screen credit, signage at the refreshments table, newsletter thank-you",
  },
  {
    n: "Production Partner",
    provide: "Lighting, audio or AV gear, or a discount on it",
    receive:
      "“Production partner” credit in every episode, behind-the-scenes feature, website listing",
  },
];

function Partner() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const { data: logos = [] } = useQuery({
    queryKey: ["past-sponsors"],
    queryFn: async () => {
      const [e, t] = await Promise.all([
        supabase
          .from("episodes")
          .select("sponsor_name,sponsor_logo_url,sponsor_url")
          .not("sponsor_name", "is", null),
        supabase
          .from("tapings")
          .select("sponsor_name,sponsor_logo_url,sponsor_url")
          .not("sponsor_name", "is", null),
      ]);
      const all = [...(e.data ?? []), ...(t.data ?? [])];
      return [...new Map(all.map((s) => [s.sponsor_name, s])).values()];
    },
  });
  return (
    <>
      <PageHeader image={studio} eyebrow="Sponsorship" title="Partner With Us">
        Support honest conversation about faith, history and today — and reach a room that's paying
        attention.
      </PageHeader>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="eyebrow">— Audience reach</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-4">
          {reach.map(([n, l]) => (
            <li key={l} className="border-t border-gold pt-3">
              <p className="font-display text-5xl text-gold">{n}</p>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {l}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">Numbers coming soon.</p>
      </section>
      <section className="bg-stage text-stage-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow text-gold">— Sponsorship packages</p>
          <p className="mt-3 max-w-2xl text-stage-foreground/85">
            Founding rates are locked for 12 months for sponsors who sign before the March 2027
            launch. Sponsor mentions name the business, what it does and where it is.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {packages.map((p) => (
              <div key={p.n} className="flex flex-col rounded-3xl border border-gold/40 p-6">
                <p className="font-display text-2xl">{p.n}</p>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-display text-3xl text-gold">{p.founding}</span>
                  {p.founding !== p.standard && (
                    <span className="text-sm text-stage-foreground/60 line-through">
                      {p.standard}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold/80">
                  {p.founding === p.standard ? "Flat rate" : "Founding rate"}
                </p>
                <p className="mt-4 text-sm text-stage-foreground/85">{p.f}</p>
              </div>
            ))}
          </div>

          <p className="eyebrow mt-14 text-gold">— In-kind partnerships</p>
          <p className="mt-3 max-w-2xl text-stage-foreground/85">
            Partner with products or services instead of cash, and receive on-screen credit.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {inKind.map((k) => (
              <div key={k.n} className="rounded-3xl border border-gold/40 p-6">
                <p className="font-display text-2xl">{k.n}</p>
                <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold/80">
                  You provide
                </p>
                <p className="text-sm text-stage-foreground/85">{k.provide}</p>
                <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold/80">
                  You receive
                </p>
                <p className="text-sm text-stage-foreground/85">{k.receive}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-stage-foreground/70">
            In His Name Ministries is a nonprofit ministry with{" "}
            <span className="[font-variant-ligatures:none]">501(c)(3)</span> status pending. We
            provide receipts for in-kind gifts; whether a gift is tax-deductible depends on the IRS
            granting exemption.
          </p>

          <Button asChild variant="gold" className="mt-8">
            <a href={mediaKitUrl(settings)} download onClick={trackMediaKitDownload}>
              <Download className="size-4" aria-hidden /> Download media kit (PDF)
            </a>
          </Button>
        </div>
      </section>
      {logos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <p className="eyebrow">— Past partners</p>
          <ul className="mt-4 flex flex-wrap items-center gap-8">
            {logos.map((s) => (
              <li key={s.sponsor_name}>
                {s.sponsor_logo_url ? (
                  <img
                    src={s.sponsor_logo_url}
                    alt={`${s.sponsor_name} logo`}
                    className="h-12 w-auto object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-display text-xl">{s.sponsor_name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">— Let's talk</p>
            <h2 className="display-lg">
              Sponsor <span className="italic-gold">inquiry</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tell us about your business and we'll send packages and dates.
            </p>
          </div>
          <ContactForm topic="sponsors" cta="Send sponsor inquiry" />
        </div>
      </section>
    </>
  );
}
