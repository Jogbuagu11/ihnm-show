import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { fmtClock, shuttleLoops } from "@/lib/show";
import { useTapingData } from "./dashboard";

export function ShuttleManifest({ taping }: { taping: Taping }) {
  const { data, refetch } = useTapingData(taping.id);
  useEffect(() => {
    const ch = supabase
      .channel(`shuttle-${taping.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shuttle_bookings",
          filter: `taping_id=eq.${taping.id}`,
        },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [taping.id, refetch]);

  const loops = [
    ...shuttleLoops(taping.shuttle_start, taping.shuttle_end, taping.shuttle_interval_min),
    "return",
  ];
  const shuttles = data?.shuttles ?? [];
  return (
    <div className="grid gap-4 py-4 md:grid-cols-2">
      {loops.map((l) => {
        const riders =
          l === "return"
            ? shuttles.filter((s) => s.direction !== "to")
            : shuttles.filter((s) => s.loop_time === l);
        return (
          <div key={l} className="rounded-2xl border bg-card p-4">
            <div className="flex justify-between">
              <p className="font-display text-xl font-semibold">
                {l === "return" ? "Return after show" : `${fmtClock(l)} loop`}
              </p>
              <p className="text-sm text-muted-foreground">
                {riders.reduce((a, r) => a + r.seats, 0)}
                {l !== "return" && `/${taping.shuttle_seats_per_loop}`}
              </p>
            </div>
            <ul className="mt-2 divide-y text-sm">
              {riders.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span>
                    {r.reservation?.full_name} · {r.seats}
                  </span>
                  <span className="flex gap-1 text-xs">
                    {r.arrived_at && (
                      <span className="rounded-full bg-gold/30 px-2 py-0.5">Here</span>
                    )}
                    {r.running_late_at && !r.arrived_at && (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">
                        Late
                      </span>
                    )}
                    {r.reservation?.status === "checked_in" && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">
                        Checked in
                      </span>
                    )}
                  </span>
                </li>
              ))}
              {riders.length === 0 && <li className="py-2 text-muted-foreground">No riders.</li>}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
