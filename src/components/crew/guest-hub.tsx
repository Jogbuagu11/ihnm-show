import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { fmtDate, fmtTime, LOCATION } from "@/lib/show";
import { Crud, Pill, useTable, db } from "@/components/finance/crud";
import { Button } from "@/components/ui/button";

export function GuestHub({ taping }: { taping: Taping; tapings: Taping[] }) {
  const qc = useQueryClient();
  const { data: experts = [] } = useTable("experts");
  const { data: tapings = [] } = useTable("tapings", "starts_at");
  const { data: releases = [] } = useQuery({
    queryKey: ["hub-releases", taping.id],
    queryFn: async () => (await supabase.from("guest_releases").select("name,email,signed_at").eq("taping_id", taping.id)).data ?? [],
  });
  const expertOpts = experts.map((e) => ({ v: e.id as string, l: e.name as string }));
  const tapingOpts = tapings.map((t) => ({ v: t.id as string, l: `${t.theme} · ${String(t.starts_at).slice(0, 10)}` }));
  const exp = (id: string) => experts.find((e) => e.id === id);
  const signed = (e?: { name: string; email: string | null }) => !!e && releases.some((r) => r.signed_at && ((e.email && r.email?.toLowerCase() === e.email.toLowerCase()) || r.name.toLowerCase() === e.name.toLowerCase()));

  function briefing(b: { expert_id: string; briefing: string | null; id: string }) {
    const e = exp(b.expert_id); if (!e?.email) return toast.error("Add an email to this expert first");
    const t = tapings.find((x) => x.id === (b as { taping_id?: string }).taping_id) ?? taping;
    const text = `Hi ${e.name},\n\nThank you for joining IHNM Show.\n\nTAPING: ${t.theme}\nWHEN: ${fmtDate(t.starts_at)} at ${fmtTime(t.starts_at)} (please arrive 60 minutes early)\nWHERE: ${LOCATION}\n\n${b.briefing ?? "Topics, run of show and talking points will follow."}\n\nWhat to wear: solid colors, no small patterns or logos.\n\nSee you soon,\nIHNM Show`;
    window.location.href = `mailto:${e.email}?subject=${encodeURIComponent(`Your IHNM Show briefing — ${t.theme}`)}&body=${encodeURIComponent(text)}`;
    db.from("expert_bookings").update({ briefing_sent_at: new Date().toISOString() }).eq("id", b.id).then(() => qc.invalidateQueries({ queryKey: ["fin", "expert_bookings"] }));
  }
  async function clips(b: Record<string, string | null> & { id: string; expert_id: string }) {
    const e = exp(b.expert_id); if (!e?.email) return toast.error("Add an email to this expert first");
    const paths = [b.clip_1, b.clip_2, b.clip_3, b.clip_4, b.clip_5].filter(Boolean) as string[];
    if (!paths.length) return toast.error("Upload at least one clip first");
    const links: string[] = [];
    for (const p of paths) { const { data } = await supabase.storage.from("finance").createSignedUrl(p, 7 * 86400); if (data) links.push(data.signedUrl); }
    await db.from("expert_bookings").update({ clips_sent_at: new Date().toISOString() }).eq("id", b.id);
    qc.invalidateQueries({ queryKey: ["fin", "expert_bookings"] });
    window.location.href = `mailto:${e.email}?subject=${encodeURIComponent("Your IHNM Show clip pack")}&body=${encodeURIComponent(`Hi ${e.name},\n\nHere are your clips to share (links work for 7 days):\n\n${links.join("\n\n")}\n\nPlease tag IHNM Show when you post!\n\nIHNM Show`)}`;
  }

  return (
    <div className="mt-4 space-y-10">
      <section>
        <h2 className="text-2xl">Bookings</h2>
        <p className="text-sm text-muted-foreground">Release status comes from the Releases tab. Send the briefing about a week before the taping.</p>
        <Crud table="expert_bookings" title="guest booking" fields={[
          { k: "expert_id", label: "Expert", type: "select", options: expertOpts, required: true },
          { k: "taping_id", label: "Taping", type: "select", options: tapingOpts, def: taping.id, required: true },
          { k: "status", label: "Status", type: "select", options: ["invited", "confirmed", "declined"] },
          { k: "briefing", label: "Briefing notes (topics, run of show)", type: "textarea" },
          { k: "clip_1", label: "Clip 1", type: "file" }, { k: "clip_2", label: "Clip 2", type: "file" }, { k: "clip_3", label: "Clip 3", type: "file" },
          { k: "clip_4", label: "Clip 4", type: "file" }, { k: "clip_5", label: "Clip 5", type: "file" },
          { k: "posted", label: "Guest posted their clips", type: "bool" },
        ]} columns={(r) => { const e = exp(r.expert_id); const t = tapings.find((x) => x.id === r.taping_id); const sig = r.taping_id === taping.id && signed(e);
          return <><span className="font-semibold">{e?.name ?? "—"}</span><Pill tone={r.status === "confirmed" ? "good" : r.status === "declined" ? "bad" : "warn"}>{r.status}</Pill>{sig && <Pill tone="good">release signed</Pill>}{r.posted && <Pill tone="good">posted</Pill>}
            <span className="block text-xs text-muted-foreground">{t?.theme ?? ""} · briefing {r.briefing_sent_at ? "sent" : "not sent"} · clips {r.clips_sent_at ? "sent" : "not sent"}</span></>; }}
          actions={(r) => <><Button size="sm" variant="outline" onClick={() => briefing(r)}>Send briefing</Button><Button size="sm" variant="outline" onClick={() => clips(r)}>Send clip pack</Button></>} />
      </section>
      <section>
        <h2 className="text-2xl">Expert roster</h2>
        <Crud table="experts" title="expert" order="name" fields={[
          { k: "name", label: "Name", required: true }, { k: "field", label: "Field" }, { k: "email", label: "Email", type: "email" }, { k: "phone", label: "Phone" },
          { k: "topics", label: "Topics", wide: true }, { k: "past_appearances", label: "Past appearances", type: "textarea" }, { k: "notes", label: "Notes", type: "textarea" },
        ]} columns={(r) => <><span className="font-semibold">{r.name}</span>{r.field && <Pill>{r.field}</Pill>}<span className="block text-xs text-muted-foreground">{r.topics ?? ""}{r.email ? ` · ${r.email}` : ""}</span></>} />
      </section>
    </div>
  );
}
