import { CalendarDays, Clock, Users } from "lucide-react";
import type { TapingWithAvail } from "@/lib/queries";
import { fmtDate, fmtTime, LOCATION } from "@/lib/show";
import { Button } from "@/components/ui/button";
import { ReserveDialog } from "@/components/reserve-dialog";

export function TapingCard({ t, featured = false }: { t: TapingWithAvail; featured?: boolean }) {
  const left = t.avail.seats_left;
  return (
    <div className={`rounded-3xl border bg-card p-6 shadow-soft ${featured ? "border-gold" : "border-border"}`}>
      {featured && <p className="eyebrow">Next taping</p>}
      <h3 className="mt-1 text-2xl font-semibold">{t.theme}</h3>
      {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}
      <div className="mt-4 grid gap-2 text-sm">
        <span className="flex items-center gap-2"><CalendarDays className="size-4 text-gold" />{fmtDate(t.starts_at)}</span>
        <span className="flex items-center gap-2"><Clock className="size-4 text-gold" />{fmtTime(t.starts_at)} · {LOCATION}</span>
        <span className="flex items-center gap-2"><Users className="size-4 text-gold" />{t.guests.join(", ")}</span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className={`font-display text-3xl font-semibold ${left === 0 ? "text-destructive" : "text-walnut"}`}>{left}</p>
          <p className="text-xs text-muted-foreground">of {t.capacity} seats left{t.avail.waitlist_count > 0 ? ` · ${t.avail.waitlist_count} waiting` : ""}</p>
        </div>
        <ReserveDialog taping={t} trigger={<Button variant="gold" size="lg">{left === 0 ? "Join waitlist" : "Reserve"}</Button>} />
      </div>
    </div>
  );
}
