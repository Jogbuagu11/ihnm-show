import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function Messages({ taping }: { taping: Taping }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const { data } = useQuery({
    queryKey: ["taping-msgs", taping.id],
    queryFn: async () => {
      const [m, r] = await Promise.all([
        supabase.from("taping_messages").select("*").eq("taping_id", taping.id).order("created_at", { ascending: false }),
        supabase.from("reservations").select("email,sms_opt_in,sms_phone").eq("taping_id", taping.id).in("status", ["confirmed", "checked_in"]),
      ]);
      return { msgs: m.data ?? [], holders: r.data ?? [] };
    },
  });
  const holders = data?.holders ?? [];
  const sms = holders.filter((h) => h.sms_opt_in && h.sms_phone);
  async function send() {
    if (!body.trim()) return;
    const { error } = await supabase.from("taping_messages").insert({ taping_id: taping.id, body: body.trim().slice(0, 1000) });
    if (error) return toast.error(error.message);
    setBody(""); toast.success("Posted to every ticket holder's My Tickets page");
    qc.invalidateQueries({ queryKey: ["taping-msgs", taping.id] });
  }
  const bcc = holders.map((h) => h.email).join(",");
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">{holders.length} ticket holders · {sms.length} opted in to text updates. Messages appear on each holder's My Tickets page. Text messages turn on once a texting service is connected.</p>
      <Textarea rows={3} maxLength={1000} placeholder="e.g. Doors open 15 minutes late tonight — shuttle loops running as planned." value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button variant="gold" onClick={send} disabled={!body.trim()}>Send to all ticket holders</Button>
        {holders.length > 0 && <Button asChild variant="outline"><a href={`mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent("IHNM Show taping update")}&body=${encodeURIComponent(body)}`}>Also email them</a></Button>}
      </div>
      <ul className="grid gap-2">{(data?.msgs ?? []).map((m) => <li key={m.id} className="rounded-2xl border bg-card p-3 text-sm"><span className="font-mono text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}</span><p>{m.body}</p></li>)}</ul>
    </div>
  );
}
