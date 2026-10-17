import { createFileRoute } from "@tanstack/react-router";
import { pubContactHead, PubContact } from "./publishing.contact";
import { isBooksSite } from "@/lib/site";
import studio from "@/assets/studio.jpg";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";
import { LOCATION } from "@/lib/show";

const showHead_contact = () => ({
  meta: [
    { title: "Contact — IHNM Show" },
    {
      name: "description",
      content:
        "Contact IHNM Show about tickets, studio rentals, sponsorship, press or anything else.",
    },
    { property: "og:title", content: "Contact IHNM Show" },
    {
      property: "og:description",
      content: "Questions about tickets, rentals, sponsorship or press? Send us a message.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});

const ShowPage_contact = () => (
  <>
    <PageHeader image={studio} eyebrow={LOCATION} title="Get in touch">
      Pick a topic and your message goes straight to the right person on our team.
    </PageHeader>
    <section className="mx-auto max-w-3xl px-4 py-14">
      <ContactForm />
    </section>
  </>
);

// This path exists on both sites. The host decides which one renders;
// see src/lib/site.ts for why that is safe through hydration.
export const Route = createFileRoute("/contact")({
  head: () => (isBooksSite() ? pubContactHead() : showHead_contact()),
  component: () => (isBooksSite() ? <PubContact /> : <ShowPage_contact />),
});
