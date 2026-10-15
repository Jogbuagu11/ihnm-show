import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/finance/crud";

export function PrayerInbox() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<"all" | "prayer" | "testimony">("all");
  const { data = [] } = useQuery({
    queryKey: ["prayer"],
    queryFn: async () =>
      (await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });
  async function setStatus(id: string, status: string) {
    await supabase.from("prayer_requests").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["prayer"] });
  }
  const rows = data.filter((r) => kind === "all" || r.kind === kind);
  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        {(["all", "prayer", "testimony"] as const).map((k) => (
          <Button
            key={k}
            size="sm"
            variant={kind === k ? "gold" : "outline"}
            onClick={() => setKind(k)}
            className="capitalize"
          >
            {k}
          </Button>
        ))}
      </div>
      <ul className="divide-y rounded-2xl border bg-card">
        {rows.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">Nothing here yet.</li>
        )}
        {rows.map((r) => (
          <li key={r.id} className="space-y-2 p-4 text-sm">
            <p>
              <span className="font-semibold">{r.name || "Anonymous"}</span>{" "}
              <Pill tone={r.kind === "testimony" ? "warn" : "muted"}>{r.kind}</Pill>
              {r.share_on_air && (
                <>
                  {" "}
                  <Pill tone="warn">OK on air</Pill>
                </>
              )}{" "}
              <Pill>{r.status}</Pill>{" "}
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </p>
            <p className="whitespace-pre-wrap">{r.body}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "prayed")}>
                Prayed for
              </Button>
              {r.share_on_air && (
                <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "on air")}>
                  Used on air
                </Button>
              )}
              {r.email && (
                <Button asChild size="sm" variant="ghost">
                  <a
                    href={`mailto:${r.email}?subject=${encodeURIComponent("From the IHNM Show team")}`}
                  >
                    Reply
                  </a>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
