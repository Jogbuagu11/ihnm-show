import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery } from "@/lib/settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function top(items: string[], n = 8) {
  const m = new Map<string, number>();
  items.forEach((i) => m.set(i, (m.get(i) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function Analytics() {
  const qc = useQueryClient();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data } = useQuery({
    queryKey: ["crew", "analytics"],
    queryFn: async () => {
      const [v, r] = await Promise.all([
        supabase.from("page_views").select("path, source, session_id").gte("created_at", since).limit(10000),
        supabase.from("reservations").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      return { views: v.data ?? [], reservations: r.count ?? 0 };
    },
  });
  const { data: settings } = useQuery(siteSettingsQuery);

  async function toggle(k: "giving_enabled" | "merch_enabled", v: boolean) {
    const { error } = await supabase.from("site_settings").update(k === "giving_enabled" ? { giving_enabled: v } : { merch_enabled: v }).eq("id", 1);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["site_settings"] });
  }

  if (!data) return <p className="py-6 text-muted-foreground">Loading…</p>;
  const sessions = new Set(data.views.map((v) => v.session_id)).size;
  const ticketSessions = new Set(data.views.filter((v) => v.path.startsWith("/tickets") || v.path.startsWith("/tapings")).map((v) => v.session_id)).size;
  const conv = ticketSessions ? Math.round((data.reservations / ticketSessions) * 100) : 0;
  const sources = top([...new Map(data.views.map((v) => [v.session_id, v.source])).values()]);
  const pages = top(data.views.map((v) => v.path));
  const stats = [
    { l: "Page views", v: data.views.length },
    { l: "Visitors", v: sessions },
    { l: "Reservations", v: data.reservations },
    { l: "Ticket conversion", v: `${conv}%` },
  ];
  return (
    <div className="space-y-8 py-4">
      <p className="eyebrow">Last 30 days</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className="font-display text-3xl font-semibold text-walnut">{s.v}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Ticket conversion = reservations ÷ visitors who viewed a tickets or taping page.</p>
      <div className="grid gap-6 md:grid-cols-2">
        {[{ t: "Traffic sources", rows: sources }, { t: "Top pages", rows: pages }].map((b) => (
          <div key={b.t}>
            <h3 className="text-xl font-semibold">{b.t}</h3>
            <ul className="mt-3 divide-y rounded-2xl border bg-card">
              {b.rows.map(([k, n]) => <li key={k} className="flex justify-between p-3 text-sm"><span className="truncate">{k}</span><span className="font-semibold">{n}</span></li>)}
              {b.rows.length === 0 && <li className="p-3 text-sm text-muted-foreground">No data yet.</li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border bg-card p-5">
        <h3 className="text-xl font-semibold">Hidden pages</h3>
        <p className="text-sm text-muted-foreground">Turn on to show the link in the site footer.</p>
        <div className="mt-4 space-y-3">
          <Label className="flex items-center gap-3"><Switch checked={!!settings?.giving_enabled} onCheckedChange={(v) => toggle("giving_enabled", v)} /> Partner giving page</Label>
          <Label className="flex items-center gap-3"><Switch checked={!!settings?.merch_enabled} onCheckedChange={(v) => toggle("merch_enabled", v)} /> Merch store</Label>
        </div>
      </div>
    </div>
  );
}
