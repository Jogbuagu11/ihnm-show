import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import worship from "@/assets/worship.jpg";

export const Route = createFileRoute("/give")({
  head: () => ({
    meta: [
      { title: "Partner With Us — IHNM Show" },
      { name: "description", content: "Support IHNM Show as a giving partner." },
      { property: "og:title", content: "Partner With IHNM Show" },
      {
        property: "og:description",
        content: "Help bring Scripture, history and today's headlines to more people.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader image={worship} eyebrow="Partner giving" title="Partner With Us">
        Giving options are coming soon.
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-12 text-lg text-muted-foreground">
        <p>
          Monthly partner giving and one-time gifts will be available here soon. Thank you for
          supporting the show.
        </p>
      </div>
    </>
  ),
});
