import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/filming-consent")({
  head: () => legalHead("Audience Filming Consent", "What you agree to when you join the IHNM Show live studio audience."),
  component: () => (
    <LegalPage eyebrow="Legal" title="Audience Filming Consent">
      <p>[Placeholder] IHNM Show is recorded in front of a live audience at Studio A, San Jose. By attending, you consent to being filmed, photographed and recorded.</p>
      <h2>Use of footage</h2>
      <p>[Placeholder] Your image, voice and likeness may appear in broadcasts, online videos, social media and promotion, in any media, without payment.</p>
      <h2>Minors</h2>
      <p>[Placeholder] The adult ticket holder gives this consent on behalf of any minors listed on their ticket.</p>
      <h2>Questions</h2>
      <p>[Placeholder] If you'd prefer not to appear on camera, tell a crew member at check-in and we'll do our best to seat you out of frame.</p>
    </LegalPage>
  ),
});
