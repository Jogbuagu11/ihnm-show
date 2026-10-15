import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Download, Mic2, Sparkles } from "lucide-react";
import studio from "@/assets/studio.jpg";
import audience from "@/assets/audience.jpg";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/countdown";
import { WaitlistForm } from "@/components/waitlist-form";
import { PartnerInquiryForm } from "@/components/partner-inquiry-form";
import { siteSettingsQuery, mediaKitUrl } from "@/lib/settings";
import { LOCATION } from "@/lib/show";
import { telHref } from "@/lib/waitlist";
import { trackMediaKitDownload } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IHNM Show — Be in the first audience" },
      {
        name: "description",
        content:
          "Join the waitlist for IHNM Show, a live talk show where Scripture, history and today's headlines meet. Recording at Studio A, San Jose. Launching early 2027.",
      },
      { property: "og:title", content: "IHNM Show — Be in the first audience" },
      {
        property: "og:description",
        content:
          "A live talk show where Scripture, history and today's headlines meet. Studio A, San Jose · Launching early 2027.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ihnmshow.com/" },
      { property: "og:image", content: "https://ihnmshow.com/og-image.jpg" },
      { property: "og:image:alt", content: "The IHNM Show studio set" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://ihnmshow.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://ihnmshow.com/" }],
  }),
  component: Prelaunch,
});

const PERKS = [
  {
    icon: CalendarCheck,
    title: "First access to tickets",
    body: "Waitlist members get seats before they open to anyone else.",
  },
  {
    icon: Mic2,
    title: "Invites to private test recordings",
    body: "Come to a practice taping while we find the show's feet.",
  },
  {
    icon: Sparkles,
    title: "Behind-the-scenes updates",
    body: "Set builds, guest news and the road to our first episode.",
  },
];

const WHAT_IT_IS = [
  "One conversation each episode, from the Bible to history to today.",
  "Live worship and expert guests.",
  "A live studio audience you can be part of.",
];

function Prelaunch() {
  const { data: settings } = useQuery(siteSettingsQuery);
  const smsNumber = telHref(settings?.sms_number);
  const keyword = settings?.sms_keyword ?? "IHNM";

  return (
    <>
      {/* 1 — Hero */}
      <section className="relative isolate overflow-hidden bg-stage text-stage-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 lg:grid-cols-12 lg:pt-16">
          <div className="flex items-center justify-between lg:col-span-12">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">
              Season 1 · Prelaunch
            </p>
            <p className="hidden font-mono text-xs uppercase tracking-[0.25em] text-stage-foreground/80 sm:block">
              {LOCATION}
            </p>
          </div>

          <div className="relative z-10 lg:col-span-7 lg:pt-8">
            <h1 className="display-xl">{settings?.hero_headline ?? "Be in the first audience."}</h1>
            <div className="rule-gold mt-8 max-w-md" />
            <p className="mt-6 max-w-xl text-lg text-stage-foreground/90 md:text-xl">
              {settings?.hero_subline ??
                "A live talk show where Scripture, history and today's headlines meet. Studio A, San Jose · Launching early 2027."}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Button asChild variant="gold" size="lg">
                <a href="#waitlist">Join the waitlist</a>
              </Button>
              <Countdown target={settings?.ticket_drop_at} />
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="arch frame-gold relative overflow-hidden rounded-b-[2rem]">
              <img
                src={studio}
                alt="The IHNM Show set: a cream armchair and curved sofa in front of an arched ivory-and-gold backdrop under soft lighting."
                width={1600}
                height={912}
                loading="eager"
                className="aspect-[4/5] w-full object-cover object-[62%_center]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2 + 3 — Waitlist form, which swaps itself for the position panel */}
      <section id="waitlist" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 md:py-20">
        <p className="eyebrow">— Join the waitlist</p>
        <h2 className="display-lg mt-4">
          Save your <span className="italic-gold">seat</span> for the first taping.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Tell us where to reach you. It takes about thirty seconds.
        </p>
        <div className="mt-8">
          <WaitlistForm />
        </div>
      </section>

      {/* 4 — Perks */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow">— What you get</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {PERKS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-3xl border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 — What the show is */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="eyebrow">— What the show is</p>
            <ul className="mt-8 space-y-6">
              {WHAT_IT_IS.map((line, i) => (
                <li key={line} className="flex gap-4 border-t border-gold/40 pt-5">
                  <span className="font-display text-3xl italic text-gold" aria-hidden>
                    {["I", "II", "III"][i]}
                  </span>
                  <p className="font-display text-xl leading-snug md:text-2xl">{line}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="frame-gold overflow-hidden rounded-3xl">
              <img
                src={audience}
                alt="A small live studio audience seated in warm light, watching the stage."
                width={1280}
                height={720}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6 + 7 — Text to join, and the newsletter */}
      <section className="bg-stage text-stage-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold">— Text to join</p>
            <p className="mt-4 font-display text-3xl md:text-4xl">
              Text <span className="italic-gold">{keyword}</span>{" "}
              {smsNumber ? (
                <>
                  to{" "}
                  <a
                    href={`sms:${smsNumber}`}
                    className="underline decoration-gold/60 underline-offset-4 hover:text-gold"
                  >
                    {settings?.sms_number}
                  </a>
                </>
              ) : (
                <span className="text-stage-foreground/60">— number coming soon</span>
              )}
            </p>
            <p className="mt-3 text-sm text-stage-foreground/70">
              Msg &amp; data rates may apply. Reply STOP to opt out.
            </p>
          </div>
          <div className="md:border-l md:border-gold/30 md:pl-10">
            <p className="eyebrow text-gold">— Newsletter</p>
            <p className="mt-4 font-display text-2xl">Get the weekly IHNM newsletter</p>
            <p className="mt-2 text-sm text-stage-foreground/80">
              Scripture, history and the week's headlines, in your inbox.
            </p>
            {settings?.substack_url ? (
              <Button asChild variant="gold" className="mt-5">
                <a href={settings.substack_url} target="_blank" rel="noopener noreferrer">
                  Read the newsletter
                </a>
              </Button>
            ) : (
              <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-stage-foreground/60">
                Launching soon
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 8 — Partner with us */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">— Partner with us</p>
            <h2 className="display-lg mt-4">
              Reach a room that's <span className="italic-gold">paying attention.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sponsors put their name beside honest conversation about faith, history and today — on
              set, on air and in the newsletter.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <a href={mediaKitUrl(settings)} download onClick={trackMediaKitDownload}>
                <Download className="size-4" aria-hidden /> Download media kit
              </a>
            </Button>
          </div>
          <PartnerInquiryForm />
        </div>
      </section>
    </>
  );
}
