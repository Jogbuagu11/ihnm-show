import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () =>
    legalHead(
      "Terms of Use",
      "Terms for using the IHNM Show website and reserving studio audience seats.",
    ),
  component: () => (
    <LegalPage eyebrow="Legal" title="Terms of Use">
      <p>
        [Placeholder] By using this website and reserving seats for IHNM Show tapings, you agree to
        these terms.
      </p>
      <h2>Reservations</h2>
      <p>
        [Placeholder] Tickets are free unless stated otherwise and are non-transferable. Seating is
        not guaranteed; we release extra tickets to cover no-shows, so please arrive early. Repeat
        no-shows may be limited to one reservation at a time.
      </p>
      <h2>Minors</h2>
      <p>
        [Placeholder] Attendees under 18 must be listed on, and accompanied by, an adult's ticket.
      </p>
      <h2>Conduct</h2>
      <p>[Placeholder] We may refuse entry or remove anyone who disrupts the taping.</p>
      <h2>Changes</h2>
      <p>[Placeholder] Taping dates, guests and times may change without notice.</p>
    </LegalPage>
  ),
});
