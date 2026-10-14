import { createFileRoute } from "@tanstack/react-router";
import studio from "@/assets/studio.jpg";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";
import { LOCATION } from "@/lib/show";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — IHNM Show" },
      { name: "description", content: "Contact IHNM Show about tickets, studio rentals, sponsorship, press or anything else." },
      { property: "og:title", content: "Contact IHNM Show" },
      { property: "og:description", content: "Questions about tickets, rentals, sponsorship or press? Send us a message." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader image={studio} eyebrow={LOCATION} title="Get in touch">Pick a topic and your message goes straight to the right person on our team.</PageHeader>
      <section className="mx-auto max-w-3xl px-4 py-14"><ContactForm /></section>
    </>
  ),
});
