import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Ban } from "lucide-react";
import studio from "@/assets/studio.jpg";
import podcast from "@/assets/rent-podcast.jpg";
import event from "@/assets/rent-event.jpg";
import panel from "@/assets/panel.jpg";
import { PageHeader } from "@/components/page-header";
import { BookingForm, useRentalSettings } from "@/components/rent/booking-form";
import { InquiryForm } from "@/components/rent/inquiry-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usd } from "@/lib/finance";
import { DEFAULT_RENTAL_SETTINGS, packPrice } from "@/lib/rentals";
import { LOCATION } from "@/lib/show";

export const Route = createFileRoute("/rent")({
  head: () => ({
    meta: [
      { title: "Rent Studio A — IHNM Show" },
      {
        name: "description",
        content:
          "Book Studio A in San Jose for podcasts, video recording, workshops and small events. Live availability and instant quotes.",
      },
      { property: "og:title", content: "Rent Studio A — IHNM Show" },
      {
        property: "og:description",
        content:
          "Podcast and video recording, podcast packages, and small events at Studio A, San Jose.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rent,
});

const gallery = [
  {
    src: podcast,
    alt: "Podcast set with two leather armchairs and boom microphones under warm lamps",
  },
  {
    src: event,
    alt: "Studio A arranged for a workshop with rows of cream chairs facing a lit stage",
  },
  { src: studio, alt: "Studio A main stage with broadcast lighting" },
  { src: panel, alt: "Panel conversation set with guests seated on stage" },
];
const faq = [
  [
    "Can I bring my own equipment?",
    "Yes. Recording rentals include the set, lights and Wi-Fi; bring your own cameras and mics, or choose the podcast package to use ours with an operator.",
  ],
  [
    "How many people can come?",
    "Up to 30 people total, counting your guests and any staff. The booking form won't go above that.",
  ],
  [
    "Why are some dates closed?",
    "IHNM Show taping days are blocked automatically so the studio is ready for our live audience.",
  ],
  [
    "When do I pay?",
    "A 50% deposit secures your time, and the balance is due 3 days before the booking. A refundable security deposit is returned after your rental. Online card payment is coming soon.",
  ],
  ["Where is the studio?", `${LOCATION}. You'll get access instructions in your confirmation.`],
  [
    "What if I need to cancel?",
    "Full refund 7 or more days out, 50% within 7 days, and no refund within 48 hours of the booking.",
  ],
] as const;

function Rent() {
  const { data: s = DEFAULT_RENTAL_SETTINGS } = useRentalSettings();
  const { user } = useAuth();
  const [packBusy, setPackBusy] = useState(false);
  const rates = [
    { t: "Podcast / video", p: `${usd(s.podcast_hourly_cents)}`, u: "per hour · 2-hr min" },
    {
      t: "Podcast package",
      p: `${usd(s.package_hourly_cents)}`,
      u: "per hour · cameras, mics & operator",
    },
    { t: "Half-day event", p: usd(s.half_day_cents), u: "4 hours" },
    { t: "Full-day event", p: usd(s.full_day_cents), u: "8 hours" },
  ];
  async function buyPack() {
    if (!user) return;
    setPackBusy(true);
    const { error } = await supabase.rpc("buy_hour_pack", {
      _name: (user.user_metadata?.["full_name"] as string | undefined) ?? user.email ?? "Renter",
      _email: user.email ?? "",
    });
    setPackBusy(false);
    if (error) return toast.error(error.message);
    toast.success(
      "Hour pack requested — we'll contact you to collect payment, then the hours appear in My Bookings.",
    );
  }
  return (
    <>
      <PageHeader image={studio} eyebrow={LOCATION} title="Rent Studio A">
        Record your podcast, film a series, or gather your people on the stage where IHNM Show
        tapes.
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((g, i) => (
            <img
              key={i}
              src={g.src}
              alt={g.alt}
              width={1280}
              height={896}
              loading={i ? "lazy" : undefined}
              className={`h-56 w-full rounded-3xl object-cover ${i === 0 ? "sm:col-span-2 sm:h-full lg:row-span-2" : ""}`}
            />
          ))}
        </div>
      </section>

      <section className="bg-stage text-stage-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold">— Rates</p>
            <ul className="mt-4 divide-y divide-gold/25">
              {rates.map((r) => (
                <li key={r.t} className="flex items-baseline justify-between py-3">
                  <span className="font-display text-xl">{r.t}</span>
                  <span className="text-right">
                    <span className="font-display text-2xl text-gold">{r.p}</span>
                    <span className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] text-stage-foreground/75">
                      {r.u}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-gold/40 p-4">
              <p className="font-display text-xl">
                Hour pack ·{" "}
                <span className="italic-gold">
                  {s.pack_hours} hours for {usd(packPrice(s))}
                </span>
              </p>
              <p className="mt-1 text-sm text-stage-foreground/80">
                For regular podcasters — {s.pack_discount_pct}% off recording time.
              </p>
              {user ? (
                <Button
                  variant="gold"
                  size="sm"
                  className="mt-3"
                  disabled={packBusy}
                  onClick={buyPack}
                >
                  Request an hour pack
                </Button>
              ) : (
                <Button asChild variant="hero" size="sm" className="mt-3">
                  <Link to="/auth">Sign in to buy</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-6">
            <div>
              <p className="eyebrow text-gold">— What's included</p>
              <ul className="mt-3 grid gap-2 text-stage-foreground/90">
                {[
                  "The IHNM set",
                  "Seating for up to 20",
                  "Stage lighting",
                  "Restroom",
                  "Wi-Fi",
                  "Podcast package adds cameras, mics and an operator",
                ].map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-gold">— House rules</p>
              <ul className="mt-3 grid gap-2 text-stage-foreground/90">
                {[
                  "No alcohol",
                  "No smoking",
                  "Cleanup required",
                  "End time is enforced",
                  `Max ${s.max_capacity} people including staff`,
                ].map((x) => (
                  <li key={x} className="flex gap-2">
                    <Ban className="mt-0.5 size-4 shrink-0 text-onair" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="rule-gold" />
      </section>

      <section id="book" className="mx-auto max-w-6xl px-4 py-16">
        <p className="eyebrow">— Book</p>
        <h2 className="display-lg">
          Check dates & <span className="italic-gold">book</span>
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Times shown in Pacific time. Taping days are closed to rentals.
        </p>
        <div className="mt-8">
          <BookingForm />
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">— Something bigger?</p>
            <h2 className="display-lg">
              Request an <span className="italic-gold">event</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Custom setups, longer days or special requests — tell us what you have in mind and
              we'll reply with a quote and payment link.
            </p>
          </div>
          <InquiryForm />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="eyebrow">— FAQ</p>
        <h2 className="display-lg">
          Good <span className="italic-gold">questions</span>
        </h2>
        <Accordion type="single" collapsible className="mt-6">
          {faq.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="font-display text-xl">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
