import { createFileRoute } from "@tanstack/react-router";
import { pubTermsHead, PubTerms } from "./publishing.terms";
import { isBooksSite } from "@/lib/site";
import { LegalPage, legalHead } from "@/components/legal-page";

const showTermsHead = () =>
  legalHead(
    "Terms of Use",
    "Terms for using the IHNM Show website and reserving studio audience seats.",
  );

function ShowTerms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Use"
      intro="The terms for using this site and attending a taping."
      updated="15 October 2026"
      draft
    >
      <p>
        By using this website and reserving seats for IHNM Show tapings, you agree to these terms.
      </p>
      <h2>Reservations</h2>
      <p>
        Tickets are free unless stated otherwise and are non-transferable. Seating is not
        guaranteed; we release extra tickets to cover no-shows, so please arrive early. Repeat
        no-shows may be limited to one reservation at a time.
      </p>
      <h2>Minors</h2>
      <p>Attendees under 18 must be listed on, and accompanied by, an adult's ticket.</p>
      <h2>Conduct</h2>
      <p>We may refuse entry or remove anyone who disrupts the taping.</p>
      <h2>Changes</h2>
      <p>Taping dates, guests and times may change without notice.</p>
    </LegalPage>
  );
}

// This path exists on both sites. The host decides which one renders;
// see src/lib/site.ts for why that is safe through hydration.
export const Route = createFileRoute("/terms")({
  head: () => (isBooksSite() ? pubTermsHead() : showTermsHead()),
  component: () => (isBooksSite() ? <PubTerms /> : <ShowTerms />),
});
