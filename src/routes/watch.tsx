import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import panel from "@/assets/panel.jpg";
import { PageHeader } from "@/components/page-header";
import { EpisodeCard } from "@/components/episode-card";
import { Input } from "@/components/ui/input";
import { episodesQuery } from "@/lib/queries";

export const Route = createFileRoute("/watch")({
  head: () => ({
    meta: [
      { title: "Watch Episodes — IHNM Show" },
      {
        name: "description",
        content: "Browse IHNM Show episodes, long-form Sit-Downs, and live expert panel Specials.",
      },
      { property: "og:title", content: "Watch IHNM Show" },
      {
        property: "og:description",
        content: "Episodes, Sit-Downs and Specials on Scripture, history and today's headlines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Watch,
});

const filters = [
  { v: "all", l: "All" },
  { v: "episode", l: "Episodes" },
  { v: "sitdown", l: "Sit-Downs" },
  { v: "special", l: "Specials" },
] as const;

function Watch() {
  const { data = [] } = useQuery(episodesQuery);
  const [kind, setKind] = useState<string>("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter(
      (e) =>
        (kind === "all" || e.kind === kind) &&
        (!s ||
          [e.title, e.description ?? "", ...e.guests, ...e.tags].some((x) =>
            x.toLowerCase().includes(s),
          )),
    );
  }, [data, kind, q]);

  return (
    <>
      <PageHeader image={panel} eyebrow="Show catalogue" title="Watch" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.v}
                onClick={() => setKind(f.v)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${kind === f.v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
              >
                {f.l}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search topic or guest"
              className="rounded-full pl-9"
            />
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <EpisodeCard key={e.id} ep={e} />
          ))}
        </div>
        {list.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">No episodes match that search.</p>
        )}
      </div>
    </>
  );
}
