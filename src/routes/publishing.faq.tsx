import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IMPRINT, pubSettingsQuery } from "@/lib/publishing";

export const Route = createFileRoute("/publishing/faq")({
  head: () => ({
    meta: [
      { title: `FAQ — ${IMPRINT}` },
      {
        name: "description",
        content:
          "Do I pay anything? Do I keep my copyright? What royalties do you pay? Answers for authors.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Faq,
});

function Faq() {
  const { data: settings } = useQuery(pubSettingsQuery);
  // Rate and term are settings, not prose, because they are contractual.
  const rate = settings?.royalty_rate_pct
    ? `${Number(settings.royalty_rate_pct)}%`
    : "[royalty rate]";
  const term = settings?.contract_term_years ? `${settings.contract_term_years} years` : "[term]";

  const qa = [
    {
      q: "Do I pay anything?",
      a: "No. We never charge authors to publish. We pay for editing, cover design, layout, ISBNs and distribution. If anyone asks you for money on our behalf, it is not us.",
    },
    {
      q: "Do I keep my copyright?",
      a: "Yes. The work stays yours. You license us the right to publish it for a fixed term; we do not take ownership of it.",
    },
    {
      q: "What royalties do you pay?",
      a: `${rate} of net receipts, paid quarterly with a statement showing sales by format and channel.`,
    },
    {
      q: "How long is the contract?",
      a: `${term}, after which the rights are yours to renew or take elsewhere.`,
    },
    {
      q: "Where will my book be sold?",
      a: "Amazon, bookshops, libraries and Christian retailers, distributed through IngramSpark so any shop can order it.",
    },
    {
      q: "Do you do audiobooks?",
      a: "For some titles. It depends on the book and the author's availability to narrate, and we decide together before production starts.",
    },
    {
      q: "Can I get my rights back?",
      a: "Yes. Rights revert if the book goes out of print, or if sales fall below the level set in your contract. That threshold is written into the contract, not decided afterwards.",
    },
    {
      q: "What happens to my manuscript if you decline?",
      a: "We keep it confidential and delete the file six months after we reply.",
    },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <p className="eyebrow">— For authors</p>
      <h1 className="display-lg mt-4">Questions</h1>

      <Accordion type="single" collapsible className="mt-8">
        {qa.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="text-left font-display text-lg">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
