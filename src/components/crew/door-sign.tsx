import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtTime, LOCATION } from "@/lib/show";

export function DoorSign({ taping }: { taping: { id: string; theme: string; starts_at: string } }) {
  const { data: code } = useQuery({ queryKey: ["door", taping.id], queryFn: async () => {
    const { data, error } = await supabase.rpc("door_code", { _taping: taping.id });
    if (error) throw error;
    return data as string;
  } });
  const url = code && typeof window !== "undefined" ? `${window.location.origin}/checkin?t=${taping.id}&c=${code}` : "";
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground print:hidden">Print this sign and tape it by the door. Guests scan it with their phone to check themselves in (opens 3 hours before the taping). Ushers can still scan tickets in the Check-in tab.</p>
      <Button className="mt-3 print:hidden" variant="outline" onClick={() => window.print()}>Print door sign</Button>
      <div className="mx-auto mt-6 max-w-md rounded-3xl border-2 border-gold bg-ivory p-8 text-center text-walnut">
        <p className="eyebrow">IHNM Show · {LOCATION}</p>
        <h2 className="mt-2 font-display text-4xl">Scan to <span className="italic-gold">check in</span></h2>
        <p className="mt-2 text-sm">{taping.theme} · {fmtDate(taping.starts_at)} · {fmtTime(taping.starts_at)}</p>
        <div className="mx-auto mt-6 w-fit rounded-2xl bg-background p-4">{url ? <QRCodeSVG value={url} size={240} /> : <div className="size-60" />}</div>
        <p className="mt-4 text-xs">Sign in with the account you reserved with. No reservation? See an usher.</p>
      </div>
    </div>
  );
}
