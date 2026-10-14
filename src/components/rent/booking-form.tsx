import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usd } from "@/lib/finance";
import { DEFAULT_RENTAL_SETTINGS, RENTAL_TYPES, pacific, pacificDays, quote, type Addons, type RentalSettings, type RentalType } from "@/lib/rentals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TZ = "America/Los_Angeles";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const times = Array.from({ length: 29 }, (_, i) => { const m = 8 * 60 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`; });
const clock = (t: string) => { const [h, m] = t.split(":").map(Number) as [number, number]; return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };

export function useRentalSettings() {
  return useQuery({
    queryKey: ["rental-settings"],
    queryFn: async () => ((await supabase.from("rental_settings").select("*").eq("id", 1).maybeSingle()).data as RentalSettings | null) ?? DEFAULT_RENTAL_SETTINGS,
  });
}

type Busy = { starts_at: string; ends_at: string; kind: string };

export function BookingForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: s = DEFAULT_RENTAL_SETTINGS } = useRentalSettings();
  const days = useMemo(() => pacificDays(28, 1), []);
  const from = dayKey(days[0]!); const to = dayKey(days[days.length - 1]!);
  const { data: busy = [] } = useQuery({
    queryKey: ["studio-busy", from, to],
    queryFn: async () => ((await supabase.rpc("studio_busy", { _from: from, _to: to })).data ?? []) as Busy[],
  });
  const { data: packHours = 0 } = useQuery({
    queryKey: ["my-pack-hours", user?.id], enabled: !!user,
    queryFn: async () => ((await supabase.from("hour_packs").select("hours,hours_used,status").eq("status", "paid")).data ?? []).reduce((a, p) => a + Number(p.hours) - Number(p.hours_used), 0),
  });

  const [type, setType] = useState<RentalType>("podcast");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("10:00");
  const [hours, setHours] = useState(2);
  const [headcount, setHeadcount] = useState(2);
  const [addons, setAddons] = useState<Addons>({});
  const [usePack, setUsePack] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState(user?.email ?? ""); const [phone, setPhone] = useState("");
  const [signature, setSignature] = useState(""); const [agree, setAgree] = useState(false);
  const [busyBtn, setBusyBtn] = useState(false);
  const [done, setDone] = useState<null | { total: number; deposit: number; security: number }>(null);

  const fixed = RENTAL_TYPES[type].fixedHours;
  const h = fixed ?? hours;
  const q = quote(type, h, addons, s, usePack && type === "podcast" ? packHours : 0);
  const startAt = date ? pacific(date, start) : null;
  const endAt = startAt ? new Date(startAt.getTime() + h * 36e5) : null;
  const setupStart = startAt ? new Date(startAt.getTime() - (addons.setup_hours ?? 0) * 36e5) : null;
  const dayBusy = (d: string) => busy.filter((b) => dayKey(new Date(b.starts_at)) === d || (b.kind === "taping" && dayKey(new Date(new Date(b.starts_at).getTime() + 6e5)) === d));
  const isTaping = (d: string) => dayBusy(d).some((b) => b.kind === "taping");
  const clash = !!(setupStart && endAt && busy.some((b) => new Date(b.starts_at) < endAt && new Date(b.ends_at) > setupStart));
  const lateEnd = !!(endAt && date && endAt > pacific(date, "23:00"));
  const overCap = headcount > s.max_capacity;

  async function book() {
    if (!startAt || !endAt || "error" in q) return;
    setBusyBtn(true);
    const { data, error } = await supabase.rpc("book_rental", {
      _type: type, _start: startAt.toISOString(), _end: endAt.toISOString(), _headcount: headcount,
      _addons: addons as never, _name: name, _email: email, _phone: phone, _signature: signature, _use_pack: usePack,
    });
    setBusyBtn(false);
    if (error) return toast.error(error.message);
    const r = data as { total: number; deposit: number; security: number };
    setDone(r);
    qc.invalidateQueries({ queryKey: ["studio-busy"] });
    qc.invalidateQueries({ queryKey: ["my-rentals"] });
  }

  if (done) return (
    <div className="rounded-3xl border border-gold/50 bg-card p-6">
      <p className="eyebrow text-gold">Request received</p>
      <h3 className="mt-2 font-display text-3xl">Your time is <span className="italic-gold">held</span>.</h3>
      <p className="mt-3 text-muted-foreground">Total {usd(done.total)}. A deposit of {usd(done.deposit)} secures the booking, plus a refundable {usd(done.security)} security deposit. Online card payment is coming soon — our team will contact you to collect the deposit. The balance invoice is due 3 days before your booking.</p>
      <div className="mt-4 flex gap-2"><Button asChild variant="gold"><Link to="/bookings">My Bookings</Link></Button><Button variant="outline" onClick={() => { setDone(null); setDate(""); }}>Book another</Button></div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div>
          <Label>Rental type</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(Object.keys(RENTAL_TYPES) as RentalType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={`rounded-2xl border p-3 text-left transition ${type === t ? "border-gold bg-stage text-stage-foreground" : "bg-card hover:border-gold/60"}`}>
                <span className="block font-display text-lg">{RENTAL_TYPES[t].label}</span>
                <span className="block text-xs opacity-75">{RENTAL_TYPES[t].blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Pick a date <span className="text-muted-foreground">(next 4 weeks)</span></Label>
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {days.map((d) => {
              const k = dayKey(d); const tap = isTaping(k); const n = dayBusy(k).filter((b) => b.kind === "rental").length;
              return (
                <button key={k} type="button" disabled={tap} onClick={() => setDate(k)}
                  className={`rounded-xl border p-2 text-center text-xs ${date === k ? "border-gold bg-stage text-stage-foreground" : tap ? "cursor-not-allowed bg-muted text-muted-foreground line-through" : "bg-card hover:border-gold/60"}`}>
                  <span className="block font-mono uppercase tracking-widest opacity-70">{d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ })}</span>
                  <span className="block font-display text-lg">{d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ })}</span>
                  <span className="block text-[0.65rem]">{tap ? "Taping" : n ? `${n} booked` : "Open"}</span>
                </button>
              );
            })}
          </div>
          {date && dayBusy(date).length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">Already booked that day: {dayBusy(date).map((b) => `${new Date(b.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })}–${new Date(b.ends_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })}`).join(", ")}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Start time</Label>
            <Select value={start} onValueChange={setStart}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{times.map((t) => <SelectItem key={t} value={t}>{clock(t)}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Hours</Label>
            {fixed ? <Input className="mt-1" value={`${fixed} hours`} disabled /> :
              <Input className="mt-1" type="number" min={2} max={15} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} />}</div>
          <div><Label>Expected headcount</Label>
            <Input className="mt-1" type="number" min={1} max={s.max_capacity} value={headcount} onChange={(e) => setHeadcount(Number(e.target.value))} />
            <p className={`mt-1 text-xs ${overCap ? "text-destructive" : "text-muted-foreground"}`}>Max {s.max_capacity}, including staff</p></div>
        </div>

        <div>
          <Label>Add-ons</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {([["operator", `Extra crew operator · ${usd(s.operator_hourly_cents)}/hr`], ["edited_video", `Edited video package · ${usd(s.edited_video_cents)}`], ["shuttle", `Shuttle (if available) · ${usd(s.shuttle_cents)}`]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm">
                <Checkbox checked={!!addons[k]} onCheckedChange={(v) => setAddons({ ...addons, [k]: !!v })} /> {l}
              </label>
            ))}
            <label className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm">
              Extra setup time
              <Select value={String(addons.setup_hours ?? 0)} onValueChange={(v) => setAddons({ ...addons, setup_hours: Number(v) })}>
                <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{[0, 1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n ? `${n} hr` : "None"}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-muted-foreground">{usd(s.setup_hourly_cents)}/hr</span>
            </label>
          </div>
          {type === "podcast" && packHours > 0 && (
            <label className="mt-2 flex items-center gap-2 text-sm"><Checkbox checked={usePack} onCheckedChange={(v) => setUsePack(!!v)} /> Use my hour pack ({packHours} hours left)</label>
          )}
        </div>

        {user ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>Your name</Label><Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
              <div><Label>Email</Label><Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} /></div>
              <div><Label>Phone</Label><Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} /></div>
            </div>
            <div className="rounded-2xl border bg-secondary p-4 text-sm">
              <p className="font-display text-lg">Rental agreement</p>
              <p className="mt-1 text-muted-foreground">I agree to the Studio A house rules (no alcohol, no smoking, leave the space clean, and finish by the booked end time), to stay within {s.max_capacity} people, and to cover any damage beyond normal use. I understand the security deposit is returned after the booking unless the space is damaged or rules are broken. <em>Placeholder text — to be reviewed.</em></p>
              <label className="mt-3 flex items-center gap-2"><Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} /> I've read and agree to the agreement and cancellation policy.</label>
              <Input className="mt-3" placeholder="Type your full name to sign" value={signature} onChange={(e) => setSignature(e.target.value)} maxLength={120} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-gold/50 bg-secondary p-4 text-sm">
            <Link to="/auth" className="font-semibold text-foreground underline decoration-gold underline-offset-4">Sign in</Link> to book and sign the rental agreement. You can check prices and dates without an account.
          </div>
        )}
      </div>

      <aside className="h-fit rounded-3xl bg-stage p-6 text-stage-foreground lg:sticky lg:top-24">
        <p className="eyebrow text-gold">Instant quote</p>
        {"error" in q ? <p className="mt-3 text-onair">{q.error}</p> : (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>{RENTAL_TYPES[type].label} · {h} hr{q.packHours ? ` (${q.packHours} from pack)` : ""}</dt><dd>{usd(q.base)}</dd></div>
            <div className="flex justify-between"><dt>Add-ons</dt><dd>{usd(q.extras)}</dd></div>
            <div className="rule-gold my-3" />
            <div className="flex justify-between font-display text-2xl"><dt>Total</dt><dd>{usd(q.total)}</dd></div>
            <div className="flex justify-between text-gold"><dt>Deposit due now ({s.deposit_pct}%)</dt><dd>{usd(q.deposit)}</dd></div>
            <div className="flex justify-between"><dt>Balance, due 3 days before</dt><dd>{usd(q.total - q.deposit)}</dd></div>
            <div className="flex justify-between"><dt>Refundable security deposit</dt><dd>{usd(q.security)}</dd></div>
          </dl>
        )}
        {startAt && endAt && <p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-stage-foreground/80">{startAt.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ })} – {endAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })} PT</p>}
        {clash && <p className="mt-2 text-sm text-onair">That time overlaps another booking.</p>}
        {lateEnd && <p className="mt-2 text-sm text-onair">Rentals must end by 11 PM.</p>}
        <div className="mt-4 rounded-xl border border-gold/30 p-3 text-xs text-stage-foreground/85">
          <p className="font-semibold text-gold">Cancellation policy</p>
          Full refund 7+ days out · 50% within 7 days · no refund within 48 hours.
        </div>
        <Button variant="gold" className="mt-5 w-full" disabled={!user || !date || "error" in q || clash || lateEnd || overCap || !agree || signature.trim().length < 2 || !name.trim() || busyBtn} onClick={book}>
          {busyBtn ? "Booking…" : "Sign & request booking"}
        </Button>
        <p className="mt-2 text-center text-xs text-stage-foreground/70">Card payments coming soon — we'll contact you to collect the deposit.</p>
      </aside>
    </div>
  );
}
