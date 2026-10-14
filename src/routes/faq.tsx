import { createFileRoute, Link } from "@tanstack/react-router";
import audience from "@/assets/audience.jpg";
import { PageHeader } from "@/components/page-header";
import { CONDUCT } from "@/components/code-of-conduct";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LOCATION } from "@/lib/show";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Audience FAQ — IHNM Show" },
      { name: "description", content: "Arrival time, what to wear on camera, parking and shuttle, phones, accessibility and minors at IHNM Show tapings." },
      { property: "og:title", content: "Audience FAQ — IHNM Show" },
      { property: "og:description", content: "Everything you need to know before your IHNM Show taping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Faq,
});

const qs: [string, string][] = [
  ["When should I arrive?", "Please arrive 45 minutes before taping. Doors close when cameras roll, and late arrivals may lose their seat to the waitlist."],
  ["What should I wear on camera?", "Solid, rich colors look best. Avoid small stripes, busy patterns, large logos, all-white or all-black outfits, and noisy jewelry."],
  ["Where do I park? Is there a shuttle?", `The studio is ${LOCATION}. Our free shuttle runs loops before the show and returns after — book a seat from My Tickets. Pickup location is announced before each taping.`],
  ["Do I need to silence my phone?", "Yes. Phones go on silent and stay put away while cameras roll. No outside recording or flash photos."],
  ["Is the studio accessible?", "Yes. Choose \"I need accessible seating\" when you reserve, and our crew will save wheelchair space, step-free access or an aisle seat."],
  ["Can I bring kids?", "Guests under 18 must be listed on an adult's ticket (up to 4 per adult) and stay with that adult the whole time."],
];

function Faq() {
  return (
    <>
      <PageHeader image={audience} eyebrow="Audience info" title="Before you come">Arrival, wardrobe, parking and the little things that make a great taping night.</PageHeader>
      <section className="mx-auto max-w-3xl px-4 py-14">
        <Accordion type="single" collapsible>
          {qs.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="font-display text-xl">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
        </Accordion>
        <div id="conduct" className="mt-12 rounded-3xl bg-stage p-6 text-stage-foreground">
          <p className="eyebrow text-gold">— Audience code of conduct</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">{CONDUCT.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Still have a question? <Link to="/contact" className="underline decoration-gold">Contact us</Link>.</p>
      </section>
    </>
  );
}
