import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TapingCard } from "@/components/taping-card";
import { upcomingTapingsQuery } from "@/lib/queries";
import { fmtDate, fmtTime, LOCATION } from "@/lib/show";

export const Route = createFileRoute("/tapings/$id")({
  loader: async ({ context, params }) => {
    const list = await context.queryClient.ensureQueryData(upcomingTapingsQuery);
    const t = list.find((x) => x.id === params.id);
    if (!t) throw notFound();
    return {
      title: `${t.theme} — Live Taping ${fmtDate(t.starts_at)}`,
      description: `${t.description ?? "Join the IHNM Show live studio audience."} ${fmtTime(t.starts_at)} at ${LOCATION}. Free seats.`.slice(0, 300),
      image: t.sponsor_logo_url,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | IHNM Show` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "event" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Taping — IHNM Show" }, { name: "robots", content: "noindex" }],
  }),
  component: TapingPage,
});

function TapingPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(upcomingTapingsQuery);
  const t = data.find((x) => x.id === id)!;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/tickets" className="text-sm font-semibold text-walnut">← All tapings</Link>
      <h1 className="sr-only">{t.theme}</h1>
      <div className="mt-6"><TapingCard t={t} featured /></div>
    </div>
  );
}
