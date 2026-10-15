import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { fmtShortDate } from "@/lib/show";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const kindLabels: Record<string, string> = {
  question: "Question",
  testimony: "Testimony",
  guest: "Guest idea",
  worship: "Worship application",
};

export function SubmissionsQueue({ tapings }: { tapings: Taping[] }) {
  const [status, setStatus] = useState("pending");
  const { data = [], refetch } = useQuery({
    queryKey: ["crew", "subs", status],
    queryFn: async () =>
      (
        await supabase
          .from("submissions")
          .select("*")
          .eq("status", status)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  async function update(id: string, patch: { status?: string; taping_id?: string | null }) {
    await supabase.from("submissions").update(patch).eq("id", id);
    refetch();
  }
  return (
    <div className="py-4">
      <div className="flex gap-2">
        {["pending", "selected", "declined"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {data.map((s) => (
          <li key={s.id} className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              {kindLabels[s.kind] ?? s.kind} · {s.name} · {s.email} · {fmtShortDate(s.created_at)}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{s.content}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                value={s.taping_id ?? "none"}
                onValueChange={(v) => update(s.id, { taping_id: v === "none" ? null : v })}
              >
                <SelectTrigger className="h-8 w-64">
                  <SelectValue placeholder="Episode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No episode</SelectItem>
                  {tapings.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {s.status !== "selected" && (
                <Button
                  size="sm"
                  variant="pill"
                  onClick={() => update(s.id, { status: "selected" })}
                >
                  Mark selected
                </Button>
              )}
              {s.status !== "declined" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update(s.id, { status: "declined" })}
                >
                  Decline
                </Button>
              )}
              {s.status !== "pending" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => update(s.id, { status: "pending" })}
                >
                  Back to queue
                </Button>
              )}
            </div>
          </li>
        ))}
        {data.length === 0 && <p className="text-muted-foreground">Nothing here.</p>}
      </ul>
    </div>
  );
}
