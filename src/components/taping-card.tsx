import type { TapingWithAvail } from "@/lib/queries";
import { LOCATION, TZ, fmtTime } from "@/lib/show";
import { Button } from "@/components/ui/button";
import { ReserveDialog } from "@/components/reserve-dialog";

export function TapingCard({ t, featured = false }: { t: TapingWithAvail; featured?: boolean }) {
  const left = t.avail.seats_left;
  const d = new Date(t.starts_at);
  const month = d.toLocaleDateString("en-US", { month: "short", timeZone: TZ });
  const day = d.toLocaleDateString("en-US", { day: "numeric", timeZone: TZ });
  const wk = d.toLocaleDateString("en-US", { weekday: "long", timeZone: TZ });
  const pct = Math.round(((t.capacity - left) / t.capacity) * 100);
  return (
    <article className={`relative overflow-hidden rounded-3xl border bg-card ${featured ? "border-gold shadow-glow" : "border-border shadow-soft"}`}>
      <div className="flex">
        <div className="flex w-24 shrink-0 flex-col items-center justify-center border-r border-dashed border-gold/60 bg-stage py-6 text-stage-foreground">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-gold">{month}</span>
          <span className="font-display text-5xl leading-none">{day}</span>
          <span className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest opacity-70">{wk.slice(0, 3)}</span>
        </div>
        <div className="flex-1 p-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{fmtTime(t.starts_at)} · {LOCATION}</p>
          <h3 className="mt-2 text-3xl leading-tight">{t.theme}</h3>
          {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}
          <p className="mt-3 text-sm"><span className="font-display italic text-walnut">with</span> {t.guests.join(", ")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border p-5">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-display text-4xl ${left === 0 ? "text-destructive" : "text-walnut"}`}>{left}</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">of {t.capacity} seats left</span>
          </div>
          <div className="mt-2 h-1 max-w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gold-gradient" style={{ width: `${pct}%` }} />
          </div>
          {t.avail.waitlist_count > 0 && <p className="mt-1 text-xs text-muted-foreground">{t.avail.waitlist_count} on waitlist</p>}
        </div>
        <ReserveDialog taping={t} trigger={<Button variant="gold" size="lg">{left === 0 ? "Join waitlist" : "Reserve"}</Button>} />
      </div>
    </article>
  );
}
