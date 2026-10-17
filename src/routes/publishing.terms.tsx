import { createFileRoute } from "@tanstack/react-router";
import { IMPRINT, OPERATOR } from "@/lib/publishing";

export const Route = createFileRoute("/publishing/terms")({
  head: () => ({
    meta: [
      { title: `Terms of Use — ${IMPRINT}` },
      { name: "description", content: `Terms for using the ${IMPRINT} website.` },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-3xl space-y-5 px-4 py-14 leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl">
      <p className="eyebrow">— Legal</p>
      <h1 className="display-lg">Terms of Use</h1>
      <p className="eyebrow">Last updated: 17 October 2026</p>
      <p>
        {IMPRINT} is an imprint operated by {OPERATOR}. By using this site you agree to these terms.
      </p>

      <h2>Submissions</h2>
      <p>
        Sending us a manuscript does not create a contract, an obligation to publish, or any payment
        either way. We receive a great many submissions and some will resemble each other or work we
        already have in production; we cannot be responsible for such similarities. Nothing is owed
        until a signed publishing agreement exists.
      </p>

      <h2>Our content</h2>
      <p>
        Cover images, descriptions and site text belong to us or to our authors. You may quote
        briefly with attribution for review or news. Please do not reproduce covers or extracts
        beyond that without asking.
      </p>

      <h2>Author copyright</h2>
      <p>
        Our authors keep the copyright in their work. We license the right to publish; we do not
        take ownership.
      </p>

      <h2>Links out</h2>
      <p>
        We link to retailers so you can buy our books. Those sites have their own terms, and what
        happens there is between you and them.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms; the date above says when we last did.</p>
    </section>
  ),
});
