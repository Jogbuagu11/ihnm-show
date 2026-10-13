import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";

export function useTapingData(tapingId: string) {
  return useQuery({
    queryKey: ["crew", "taping", tapingId],
    queryFn: async () => {
      const [r, w, s] = await Promise.all([
        supabase.from("reservations").select("*").eq("taping_id", tapingId).order("full_name"),
        supabase.from("waitlist").select("*").eq("taping_id", tapingId).order("created_at"),
        supabase.from("shuttle_bookings").select("*, reservation:reservations(full_name, email, status)").eq("taping_id", tapingId).neq("status", "cancelled"),
      ]);
      return { res: r.data ?? [], wait: w.data ?? [], shuttles: s.data ?? [] };
    },
  });
}

export function Dashboard({ taping }: { taping: Taping }) {
  const { data } = useTapingData(taping.id);
  if (!data) return <p className="py-6 text-muted-foreground">Loading…</p>;
  const active = data.res.filter((r) => r.status !== "cancelled");
  const seats = active.reduce((a, r) => a + r.seats, 0);
  const checked = active.filter((r) => r.status === "checked_in").reduce((a, r) => a + r.seats, 0);
  const vip = active.filter((r) => r.ticket_type === "vip").reduce((a, r) => a + r.seats, 0);
  const stats = [
    { l: "Reserved", v: `${seats}/${taping.capacity}` },
    { l: "Waitlist", v: data.wait.filter((w) => w.status !== "claimed").length },
    { l: "VIP sales", v: `${vip} · $${((vip * taping.vip_price_cents) / 100).toFixed(0)}` },
    { l: "Checked in", v: checked },
    { l: "Shuttle riders", v: data.shuttles.reduce((a, s) => a + s.seats, 0) },
  ];
  return (
    <div className="space-y-8 py-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="font-display text-3xl font-semibold text-walnut">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-xl font-semibold">Reservations</h3>
          <ul className="mt-3 divide-y rounded-2xl border bg-card">
            {data.res.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span><span className="font-semibold">{r.full_name}</span> <span className="text-muted-foreground">· {r.ticket_type} · {r.seats}</span>{r.question && <span className="block text-xs text-muted-foreground">Q: {r.question}</span>}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "checked_in" ? "bg-success/15 text-success" : r.status === "cancelled" ? "bg-muted text-muted-foreground" : "bg-blush text-blush-foreground"}`}>{r.status.replace("_", " ")}</span>
              </li>
            ))}
            {data.res.length === 0 && <li className="p-3 text-sm text-muted-foreground">No reservations yet.</li>}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Waitlist</h3>
          <ul className="mt-3 divide-y rounded-2xl border bg-card">
            {data.wait.map((w, i) => (
              <li key={w.id} className="flex justify-between p-3 text-sm">
                <span>{i + 1}. {w.full_name} <span className="text-muted-foreground">· {w.email}</span></span>
                <span className="text-xs capitalize">{w.status}</span>
              </li>
            ))}
            {data.wait.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nobody waiting.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
