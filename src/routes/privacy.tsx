import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => legalHead("Privacy Policy", "How IHNM Show collects and uses your information."),
  component: () => (
    <LegalPage eyebrow="Legal" title="Privacy Policy">
      <p>[Placeholder] We collect your name, email and reservation details to manage tickets, shuttle seats and check-in.</p>
      <h2>What we collect</h2>
      <p>[Placeholder] Account details, reservations, submissions you send us, and anonymous page-visit statistics (pages viewed and where visitors came from).</p>
      <h2>How we use it</h2>
      <p>[Placeholder] To run tapings, contact you about your tickets, and improve the show. We do not sell your information.</p>
      <h2>Your choices</h2>
      <p>[Placeholder] Contact us to update or delete your information.</p>
    </LegalPage>
  ),
});
