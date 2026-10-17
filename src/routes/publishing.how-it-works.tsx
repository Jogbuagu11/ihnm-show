import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { IMPRINT, pubPath, pubSettingsQuery } from "@/lib/publishing";

export const Route = createFileRoute("/publishing/how-it-works")({
  head: () => ({
    meta: [
      { title: `How publishing with us works — ${IMPRINT}` },
      {
        name: "description",
        content:
          "Five steps from manuscript to launch: submit, review, contract, production, and a launch on IHNM Show.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const { data: settings } = useQuery(pubSettingsQuery);
  const weeks = settings?.response_weeks ?? 8;

  const steps = [
    {
      n: "01",
      t: "You submit",
      you: "Send the first three chapters, a one-paragraph pitch and a short synopsis.",
      us: `We confirm it has arrived, and read it. You hear back within ${weeks} weeks either way.`,
    },
    {
      n: "02",
      t: "We review",
      you: "If we ask for the full manuscript, you send it. Nothing is owed either way.",
      us: "Two readers go through it. If it is a fit, we talk about what the book could be.",
    },
    {
      n: "03",
      t: "Contract",
      you: "You keep your copyright. You license us the right to publish for a fixed term.",
      us: "We put the terms in writing: royalty rate, term, formats, and how rights revert.",
    },
    {
      n: "04",
      t: "Production",
      you: "You work with the editor. You approve the cover and the final proof.",
      us: "We pay for and manage editing, cover design, layout, ISBNs and distribution.",
    },
    {
      n: "05",
      t: "Launch on IHNM Show",
      you: "You come on the show, and sign books for the live audience.",
      us: "We film the interview, run the signing, cut the clips and feature you in the newsletter.",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <p className="eyebrow">— The process</p>
      <h1 className="display-lg mt-4">How publishing with us works</h1>
      <p className="mt-5 max-w-prose text-lg text-muted-foreground">
        A traditional small press. We carry the cost and the risk; you write the book and keep the
        copyright.
      </p>

      <ol className="mt-12 space-y-10">
        {steps.map((s) => (
          <li key={s.n} className="grid gap-4 border-t border-gold/40 pt-6 sm:grid-cols-[4rem_1fr]">
            <span className="font-display text-4xl italic text-gold">{s.n}</span>
            <div>
              <h2 className="font-display text-2xl">{s.t}</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                    You
                  </dt>
                  <dd className="mt-1 text-sm">{s.you}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                    We
                  </dt>
                  <dd className="mt-1 text-sm">{s.us}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>

      <Button asChild variant="gold" size="lg" className="mt-12">
        <Link to={pubPath("/submit")}>Submit your manuscript</Link>
      </Button>
    </section>
  );
}
