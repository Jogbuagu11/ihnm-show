import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import audience from "@/assets/audience.jpg";

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  draft = false,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  /** Pages still awaiting final wording say so, rather than reading as settled. */
  draft?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader image={audience} eyebrow={eyebrow} title={title}>
        {intro}
      </PageHeader>
      <article className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-base leading-relaxed [&_h2]:mt-8 [&_h2]:text-2xl">
        <p className="eyebrow">Last updated: {updated}</p>
        {draft && (
          <p className="rounded-2xl border border-gold/50 bg-secondary/60 p-4 text-sm">
            <strong>Draft.</strong> This page describes our intended terms and is being finalised
            before tickets go on sale. For anything binding, contact us.
          </p>
        )}
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
