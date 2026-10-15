import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import audience from "@/assets/audience.jpg";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader image={audience} eyebrow={eyebrow} title={title}>
        Placeholder text — final wording to be reviewed by counsel.
      </PageHeader>
      <article className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-base leading-relaxed [&_h2]:mt-8 [&_h2]:text-2xl">
        <p className="eyebrow">Last updated: placeholder</p>
        {children}
      </article>
    </>
  );
}

export function legalHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — IHNM Show` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — IHNM Show` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
