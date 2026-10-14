import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { VOLUNTEER_ROLES, openSlots, shiftHours, type VolunteerRole } from "@/lib/volunteers";
import { pacific } from "@/lib/rentals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TZ = "America/Los_Angeles";
const t = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

export function VolunteersAdmin({ taping, isAdmin }: { taping: Taping; tapings: Taping[]; isAdmin: boolean }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["vol-admin", taping.id],
    queryFn: async () => {
      const [s, c, v, all] = await Promise.all([
        supabase.from("shifts").select("*").eq("taping_id", taping.id).order("starts_at"),
        supabase.from("shift_claims").select("*").neq("status", "released"),
        supabase.from("volunteers").select("*").order("name"),
        supabase.from("shifts").select("id,starts_at,ends_at"),
      ]);
      return { shifts: s.data ?? [], claims: c.data ?? [], vols: v.data ?? [], all: all.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["vol-admin"] });
  const day = new Date(taping.starts_at).toLocaleDateString("en-CA", { timeZone: TZ });
  const [role, setRole] = useState<VolunteerRole>("ushers");
  const [from, setFrom] = useState("17:30"); const [to, setTo] = useState("21:30"); const [slots, setSlots] = useState(2);

  async function add() {
    const { error } = await supabase.from("shifts").insert({ taping_id: taping.id, role, starts_at: pacific(day, from).toISOString(), ends_at: pacific(day, to).toISOString(), slots });
    if (error) return toast.error(error.message);
    refresh();
  }
  async function del(id: string) { await supabase.from("shifts").delete().eq("id", id); refresh(); }
  async function setStatus(id: string, status: string) { await supabase.from("shift_claims").update({ status }).eq("id", id); refresh(); }
  async function openDoc(path: string) {
    const { data: u } = await supabase.storage.from("volunteer-docs").createSignedUrl(path, 300);
    if (u) window.open(u.signedUrl, "_blank", "noopener"); else toast.error("Could not open file");
  }

  const shifts = data?.shifts ?? []; const claims = data?.claims ?? []; const vols = data?.vols ?? [];
  const name = (uid: string) => vols.find((v) => v.user_id === uid)?.name ?? "Volunteer";
  const short = shifts.reduce((a, s) => a + openSlots(s.slots, claims.filter((c) => c.shift_id === s.id).length), 0);
  const served = (uid: string) => claims.filter((c) => c.user_id === uid && c.status === "served").reduce((a, c) => {
    const s = data?.all.find((x) => x.id === c.shift_id); return a + (c.hours != null ? Number(c.hours) : s ? shiftHours(s) : 0);
  }, 0);

  return (
    <div className="mt-4 space-y-8">
      <div className={`rounded-2xl p-4 text-sm ${short ? "bg-destructive/10 text-destructive" : "bg-secondary"}`}>
        {shifts.length === 0 ? "No shifts posted for this taping yet." : short ? `Short-staffed: ${short} open spot${short > 1 ? "s" : ""} for this taping.` : "Fully staffed for this taping."}
      </div>

      <div className="grid gap-3 rounded-3xl border bg-card p-5 sm:grid-cols-5">
        <div><Label>Role</Label><Select value={role} onValueChange={(v) => setRole(v as VolunteerRole)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(VOLUNTEER_ROLES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>From</Label><Input className="mt-1" type="time" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To</Label><Input className="mt-1" type="time" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div><Label>Spots</Label><Input className="mt-1" type="number" min={1} value={slots} onChange={(e) => setSlots(Number(e.target.value))} /></div>
        <Button variant="gold" className="self-end" onClick={add}>Post shift</Button>
      </div>

      <ul className="grid gap-3">
        {shifts.map((s) => {
          const cs = claims.filter((c) => c.shift_id === s.id); const open = openSlots(s.slots, cs.length);
          return (
            <li key={s.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p><span className="font-display text-xl">{VOLUNTEER_ROLES[s.role as VolunteerRole] ?? s.role}</span> <span className="text-sm text-muted-foreground">{t(s.starts_at)}–{t(s.ends_at)} · {cs.length}/{s.slots} filled</span>{open > 0 && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{open} open</span>}</p>
                <Button size="sm" variant="ghost" onClick={() => del(s.id)}>Remove</Button>
              </div>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {cs.map((c) => <li key={c.id} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1">{name(c.user_id)} · {c.status}
                  {c.status !== "served" ? <button className="underline" onClick={() => setStatus(c.id, "served")}>mark served</button> : <button className="underline" onClick={() => setStatus(c.id, "claimed")}>undo</button>}
                  {c.status !== "no_show" && <button className="underline" onClick={() => setStatus(c.id, "no_show")}>no-show</button>}</li>)}
              </ul>
            </li>
          );
        })}
      </ul>

      <div>
        <h3 className="text-2xl">Volunteer roster</h3>
        <ul className="mt-3 grid gap-2">
          {vols.map((v) => (
            <li key={v.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card p-3 text-sm">
              <span><span className="font-semibold">{v.name}</span> · {v.roles.map((r) => VOLUNTEER_ROLES[r as VolunteerRole] ?? r).join(", ")}<span className="block text-xs text-muted-foreground">{v.email}{v.phone ? ` · ${v.phone}` : ""} · {served(v.user_id).toFixed(1)} hours served</span></span>
              {isAdmin && v.roles.includes("shuttle_driver") && (
                <span className="flex gap-2">
                  {v.license_path ? <Button size="sm" variant="outline" onClick={() => openDoc(v.license_path!)}>License</Button> : <span className="text-xs text-destructive">No license</span>}
                  {v.insurance_path ? <Button size="sm" variant="outline" onClick={() => openDoc(v.insurance_path!)}>Insurance</Button> : <span className="text-xs text-destructive">No insurance</span>}
                </span>
              )}
            </li>
          ))}
          {!vols.length && <li className="text-sm text-muted-foreground">No volunteers yet.</li>}
        </ul>
      </div>
    </div>
  );
}
