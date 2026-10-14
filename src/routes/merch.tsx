import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import panel from "@/assets/panel.jpg";

export const Route = createFileRoute("/merch")({
  head: () => ({
    meta: [
      { title: "Merch Store — IHNM Show" },
      { name: "description", content: "Official IHNM Show merchandise." },
      { property: "og:title", content: "IHNM Show Merch" },
      { property: "og:description", content: "Official IHNM Show merchandise — coming soon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader image={panel} eyebrow="Store" title="Merch Store">The shop is opening soon.</PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-12 text-lg text-muted-foreground">
        <p>Shirts, mugs and study guides are on the way. Check back soon.</p>
      </div>
    </>
  ),
});
