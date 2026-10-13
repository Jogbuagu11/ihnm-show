import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { fmtShortDate, TZ } from "@/lib/show";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// Convert a Pacific wall-clock "YYYY-MM-DDTHH:mm" to an ISO instant.
function pacificToIso(local: string) {
  const guess = new Date(local + ":00Z");
  const asPacific = new Date(guess.toLocaleString("en-US", { timeZone: TZ }));
  const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() + (asUtc.getTime() - asPacific.getTime())).toISOString();
}
function isoToPacific(iso: string) {
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: TZ }));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const blank = {
  id: "", theme: "", description: "", starts: "", guests: "", capacity: 20, vip_seats: 4, vip_price: 20, group_enabled: true,
  shuttle_start: "18:00", shuttle_end: "18:45", shuttle_interval_min: 15, shuttle_seats_per_loop: 7,
};

export function TapingsEditor({ tapings }: { tapings: Taping[] }) {
  const qc = useQueryClient();
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  function edit(t: Taping) {
    setF({
      id: t.id, theme: t.theme, description: t.description ?? "", starts: isoToPacific(t.starts_at), guests: t.guests.join(", "),
      capacity: t.capacity, vip_seats: t.vip_seats, vip_price: t.vip_price_cents / 100, group_enabled: t.group_enabled,
      shuttle_start: t.shuttle_start.slice(0, 5), shuttle_end: t.shuttle_end.slice(0, 5), shuttle_interval_min: t.shuttle_interval_min, shuttle_seats_per_loop: t.shuttle_seats_per_loop,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.theme.trim() || !f.starts) return toast.error("Theme and date are required");
    const row = {
      theme: f.theme.trim(), description: f.description.trim() || null, starts_at: pacificToIso(f.starts),
      guests: f.guests.split(",").map((g) => g.trim()).filter(Boolean),
      capacity: f.capacity, vip_seats: f.vip_seats, vip_price_cents: Math.round(f.vip_price * 100), group_enabled: f.group_enabled,
      shuttle_start: f.shuttle_start, shuttle_end: f.shuttle_end, shuttle_interval_min: f.shuttle_interval_min, shuttle_seats_per_loop: f.shuttle_seats_per_loop,
    };
    const { error } = f.id ? await supabase.from("tapings").update(row).eq("id", f.id) : await supabase.from("tapings").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Taping saved");
    setF(blank);
    qc.invalidateQueries();
  }

  return (
    <div className="grid gap-6 py-4 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={save} className="space-y-4 rounded-3xl border bg-card p-5">
        <h3 className="text-xl font-semibold">{f.id ? "Edit taping" : "New taping"}</h3>
        <div><Label>Theme</Label><Input value={f.theme} onChange={set("theme")} maxLength={150} /></div>
        <div><Label>Description</Label><Textarea value={f.description} onChange={set("description")} maxLength={1000} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Date & time (Pacific)</Label><Input type="datetime-local" value={f.starts} onChange={set("starts")} /></div>
          <div><Label>Guests (comma separated)</Label><Input value={f.guests} onChange={set("guests")} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Capacity</Label><Input type="number" min={1} value={f.capacity} onChange={set("capacity")} /></div>
          <div><Label>VIP seats</Label><Input type="number" min={0} value={f.vip_seats} onChange={set("vip_seats")} /></div>
          <div><Label>VIP price $</Label><Input type="number" min={0} value={f.vip_price} onChange={set("vip_price")} /></div>
        </div>
        <Label className="flex items-center gap-3"><Switch checked={f.group_enabled} onCheckedChange={(v) => setF({ ...f, group_enabled: v })} /> Accept church group requests</Label>
        <p className="eyebrow pt-2">Shuttle loops</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><Label>First</Label><Input type="time" value={f.shuttle_start} onChange={set("shuttle_start")} /></div>
          <div><Label>Last</Label><Input type="time" value={f.shuttle_end} onChange={set("shuttle_end")} /></div>
          <div><Label>Every (min)</Label><Input type="number" min={5} value={f.shuttle_interval_min} onChange={set("shuttle_interval_min")} /></div>
          <div><Label>Seats/loop</Label><Input type="number" min={1} value={f.shuttle_seats_per_loop} onChange={set("shuttle_seats_per_loop")} /></div>
        </div>
        <div className="flex gap-2">
          <Button variant="gold">{f.id ? "Save changes" : "Create taping"}</Button>
          {f.id && <Button type="button" variant="ghost" onClick={() => setF(blank)}>Cancel</Button>}
        </div>
      </form>
      <ul className="space-y-2">
        {tapings.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-2xl bg-secondary p-4">
            <span><span className="font-semibold">{t.theme}</span><span className="block text-xs text-muted-foreground">{fmtShortDate(t.starts_at)} · {t.capacity} seats</span></span>
            <Button size="sm" variant="outline" onClick={() => edit(t)}>Edit</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
