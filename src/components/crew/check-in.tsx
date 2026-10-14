import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, CameraOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTapingData } from "./dashboard";

export function CheckIn({ taping }: { taping: Taping }) {
  const { data, refetch } = useTapingData(taping.id);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [scanning, setScanning] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const busy = useRef(false);

  async function checkIn(code: string) {
    if (busy.current) return;
    busy.current = true;
    const { data: r, error } = await supabase.rpc("check_in", { _code: code });
    busy.current = false;
    if (error) return toast.error(error.message);
    const res = r as { name: string; seats: number; already: boolean };
    setLast(`${res.name} · ${res.seats} seat${res.seats > 1 ? "s" : ""}${res.already ? " (already checked in)" : ""}`);
    toast.success(`Checked in ${res.name}`);
    refetch();
    qc.invalidateQueries({ queryKey: ["crew"] });
  }

  async function start() {
    const { Html5Qrcode } = await import("html5-qrcode");
    const s = new Html5Qrcode("qr-reader");
    let lastCode = "";
    await s.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (text) => {
      if (text === lastCode) return;
      lastCode = text;
      checkIn(text);
      setTimeout(() => (lastCode = ""), 3000);
    }, () => {}).catch(() => toast.error("Camera not available — use name search below"));
    scannerRef.current = s;
    setScanning(true);
  }
  async function stop() {
    await scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  }
  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  async function noShow(id: string, undo = false) {
    const { error } = await supabase.rpc("mark_no_show", { _reservation: id, _undo: undo });
    if (error) return toast.error(error.message);
    toast.success(undo ? "No-show undone" : "Marked as no-show");
    refetch();
  }
  const pending = (data?.res ?? []).filter((r) => r.status === "confirmed" || r.status === "no_show");
  const matches = (data?.res ?? []).filter((r) => r.status !== "cancelled" && q.length > 1 && (r.full_name + r.email).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid gap-6 py-4 md:grid-cols-2">
      <div className="rounded-3xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Scan tickets</h3>
          {scanning ? <Button variant="outline" size="sm" onClick={stop}><CameraOff /> Stop</Button> : <Button variant="gold" size="sm" className="h-9 px-4" onClick={start}><Camera /> Start camera</Button>}
        </div>
        <div id="qr-reader" className="mt-4 overflow-hidden rounded-2xl bg-muted" />
        {last && <p className="mt-4 rounded-xl bg-success/15 p-3 text-sm font-semibold text-success">✓ {last}</p>}
      </div>
      <div className="rounded-3xl border bg-card p-5">
        <h3 className="text-xl font-semibold">Find by name</h3>
        <Input className="mt-3" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="mt-3 divide-y">
          {matches.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span><span className="font-semibold">{r.full_name}</span> · {r.seats}</span>
              {r.status === "checked_in" ? <span className="text-success">Checked in</span> : <Button size="sm" variant="pill" onClick={() => checkIn(r.qr_code)}>Check in</Button>}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border bg-card p-5 md:col-span-2">
        <h3 className="text-xl font-semibold">Not checked in</h3>
        <p className="text-sm text-muted-foreground">After doors close, mark anyone who didn't come. Two or more no-shows limits a guest to one reservation at a time.</p>
        <ul className="mt-3 divide-y">
          {pending.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span><span className="font-semibold">{r.full_name}</span> · {r.seats} seat{r.seats > 1 ? "s" : ""}</span>
              {r.status === "no_show"
                ? <Button size="sm" variant="ghost" onClick={() => noShow(r.id, true)}>Undo no-show</Button>
                : <Button size="sm" variant="outline" onClick={() => noShow(r.id)}>Mark no-show</Button>}
            </li>
          ))}
          {pending.length === 0 && <li className="py-2 text-sm text-muted-foreground">Everyone is checked in.</li>}
        </ul>
      </div>
    </div>
  );
}
