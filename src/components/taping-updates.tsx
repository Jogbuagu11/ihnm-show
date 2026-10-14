import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function TapingUpdates({ tapingId, reservationId, optIn, phone, onChange }: { tapingId: string; reservationId: string; optIn: boolean; phone: string | null; onChange: () => void }) {
  const { data: msgs = [] } = useQuery({
    queryKey: ["my-taping-msgs", tapingId],
    queryFn: async () => (await supabase.from("taping_messages").select("*").eq("taping_id", tapingId).order("created_at", { ascending: false })).data ?? [],
  });
  const [on, setOn] = useState(optIn); const [num, setNum] = useState(phone ?? "");
  async function save(next: boolean) {
    const { error } = await supabase.rpc("set_sms_pref", { _reservation: reservationId, _opt: next, _phone: num.trim() });
    if (error) return toast.error(error.message);
    setOn(next); toast.success(next ? "You're signed up for text updates" : "Text updates turned off"); onChange();
  }
  return (
    <div className="border-t p-6">
      {msgs.length > 0 && (
        <ul className="mb-4 grid gap-2">{msgs.map((m) => <li key={m.id} className="flex gap-2 rounded-xl bg-gold/10 p-3 text-sm"><Megaphone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden /><span>{m.body}<span className="block text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></span></li>)}</ul>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Switch checked={on} onCheckedChange={(v) => (v ? (num.trim().length >= 7 ? save(true) : toast.error("Add your mobile number first")) : save(false))} aria-label="Text me taping-night and shuttle updates" />
        <span>Text me taping-night and shuttle updates</span>
        {!on && <Input className="h-9 w-44" placeholder="Mobile number" value={num} onChange={(e) => setNum(e.target.value)} maxLength={20} inputMode="tel" />}
        {!on && num.trim().length >= 7 && <Button size="sm" variant="outline" onClick={() => save(true)}>Opt in</Button>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Msg & data rates may apply. Reply STOP to opt out.</p>
    </div>
  );
}
