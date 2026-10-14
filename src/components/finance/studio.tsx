import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Crud, Pill, useTable, type Field } from "@/components/finance/crud";
import { useRentalSettings } from "@/components/rent/booking-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usd, lastMonths } from "@/lib/finance";
import { RENTAL_TYPES, type RentalSettings, type RentalType } from "@/lib/rentals";

const TZ = "America/Los_Angeles";
const dk = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
const tm = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const typeOpts = (Object.keys(RENTAL_TYPES) as RentalType[]).map((v) => ({ v, l: RENTAL_TYPES[v].label }));

export function StudioAdmin() {
  return (
    <div className="mt-4 space-y-10">
      <Calendar />
      <section><h2 className="text-2xl">Bookings</h2><Bookings /></section>
      <section><h2 className="text-2xl">Event inquiries</h2><Inquiries /></section>
      <section><h2 className="text-2xl">Hour packs</h2><Packs /></section>
      <section><h2 className="text-2xl">Rental report</h2><Report /></section>
      <section><h2 className="text-2xl">Prices & limits</h2><Settings /></section>
    </div>
  );
}

function Calendar() {
  const { data: rentals = [] } = useTable("rentals");
  const days = Array.from({ length: 42 }, (_, i) => new Date(Date.now() + i * 864e5));
  const { data: tapings = [] } = useQuery({
    queryKey: ["cal-tapings"],
    queryFn: async () => (await supabase.from("tapings").select("id,theme,starts_at").gte("starts_at", new Date().toISOString())).data ?? [],
  });
  return (
    <div className="rounded-3xl border bg-card p-5">
      <h3 className="text-lg font-semibold">Next 6 weeks</h3>
      <p className="text-xs text-muted-foreground"><span className="text-gold">■</span> taping · <span className="text-foreground">■</span> booked · <span className="text-muted-foreground">■</span> hold / deposit due</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-7">
        {days.map((d) => {
          const k = dk(d);
          const tap = tapings.filter((t) => dk(t.starts_at) === k);
          const rs = rentals.filter((r) => r.status !== "canceled" && dk(r.starts_at) === k);
          return (
            <div key={k} className="min-h-24 rounded-xl border p-2 text-xs">
              <p className="font-mono uppercase tracking-widest text-muted-foreground">{d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ })}</p>
              {tap.map((t) => <p key={t.id} className="mt-1 rounded bg-stage px-1.5 py-0.5 text-gold">Taping · {t.theme}</p>)}
              {rs.map((r) => <p key={r.id} className={`mt-1 rounded px-1.5 py-0.5 ${r.status === "booked" || r.status === "completed" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{tm(r.starts_at)} {r.renter}</p>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bookings() {
  const fields: Field[] = [
    { k: "renter", label: "Renter", required: true }, { k: "email", label: "Email", type: "email" }, { k: "phone", label: "Phone" },
    { k: "rental_type", label: "Rental type", type: "select", options: typeOpts },
    { k: "starts_at", label: "Starts", type: "datetime", required: true }, { k: "ends_at", label: "Ends", type: "datetime", required: true },
    { k: "headcount", label: "Headcount", type: "number", def: 1 },
    { k: "status", label: "Status", type: "select", options: ["deposit_due", "booked", "tentative", "completed", "canceled"] },
    { k: "quote_cents", label: "Total price (custom price allowed)", type: "money" },
    { k: "deposit_cents", label: "Deposit", type: "money" }, { k: "deposit_paid", label: "Deposit paid", type: "bool" },
    { k: "balance_paid", label: "Balance paid", type: "bool" },
    { k: "security_deposit_cents", label: "Security deposit", type: "money" },
    { k: "security_status", label: "Security deposit", type: "select", options: ["held", "released", "kept"] },
    { k: "security_note", label: "Security note", wide: true },
    { k: "security_photo_path", label: "Damage / condition photo", type: "file", wide: true },
    { k: "agreement_path", label: "Signed agreement (file)", type: "file", wide: true }, { k: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">Ticking "Deposit paid" or "Balance paid" adds the money to Income under Studio Rentals automatically.</p>
      <Crud table="rentals" title="rental" order="starts_at" fields={fields} columns={(r) => (
        <><span className="font-semibold">{r.renter}</span><Pill tone={r.status === "canceled" ? "bad" : r.status === "booked" ? "good" : "warn"}>{String(r.status).replace("_", " ")}</Pill>
          {r.security_status !== "held" && <Pill tone={r.security_status === "kept" ? "bad" : "good"}>security {r.security_status}</Pill>}
          <span className="block text-xs text-muted-foreground">{new Date(r.starts_at).toLocaleString("en-US", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" })}–{tm(r.ends_at)} · {RENTAL_TYPES[r.rental_type as RentalType]?.label ?? r.rental_type} · {r.headcount} ppl · {usd(r.quote_cents)} · deposit {usd(r.deposit_cents)} {r.deposit_paid ? "✓" : "due"}{r.agreement_name ? ` · signed by ${r.agreement_name}` : ""}{r.refund_pct != null ? ` · refund ${r.refund_pct}%` : ""}</span></>
      )} />
    </>
  );
}

function Inquiries() {
  return <Crud table="rental_inquiries" title="inquiry" fields={[
    { k: "name", label: "Name", required: true }, { k: "email", label: "Email", type: "email", required: true }, { k: "phone", label: "Phone" },
    { k: "event_type", label: "Event type", required: true }, { k: "preferred_date", label: "Preferred date", type: "date" },
    { k: "headcount", label: "Guests", type: "number", def: 1 },
    { k: "status", label: "Status", type: "select", options: ["new", "quoted", "approved", "declined"] },
    { k: "quote_cents", label: "Custom quote", type: "money" }, { k: "pay_url", label: "Payment link", wide: true },
    { k: "details", label: "Details", type: "textarea", required: true }, { k: "admin_note", label: "Internal note", type: "textarea" },
  ]} columns={(r) => <><span className="font-semibold">{r.name}</span> · {r.event_type}<Pill tone={r.status === "approved" ? "good" : r.status === "declined" ? "bad" : r.status === "new" ? "warn" : "muted"}>{r.status}</Pill><span className="block text-xs text-muted-foreground">{r.headcount} guests{r.preferred_date ? ` · ${r.preferred_date}` : ""}{r.quote_cents ? ` · quote ${usd(r.quote_cents)}` : ""} · {String(r.details).slice(0, 120)}</span></>}
    actions={(r) => <Button asChild size="sm" variant="outline"><a href={`mailto:${r.email}?subject=${encodeURIComponent("Your Studio A event quote")}&body=${encodeURIComponent(`Hi ${r.name},\n\nThank you for your interest in Studio A.${r.quote_cents ? `\nYour quote: ${usd(r.quote_cents)}` : ""}${r.pay_url ? `\nPay here: ${r.pay_url}` : ""}\n\nIHNM Show`)}`}>Reply with quote</a></Button>} />;
}

function Packs() {
  return <Crud table="hour_packs" title="hour pack" fields={[
    { k: "name", label: "Name", required: true }, { k: "email", label: "Email", type: "email", required: true },
    { k: "hours", label: "Hours", type: "number", def: 10 }, { k: "hours_used", label: "Hours used", type: "number", def: 0 },
    { k: "price_cents", label: "Price", type: "money" }, { k: "status", label: "Status", type: "select", options: ["pending", "paid", "canceled"] },
  ]} columns={(r) => <><span className="font-semibold">{r.name}</span><Pill tone={r.status === "paid" ? "good" : r.status === "pending" ? "warn" : "bad"}>{r.status}</Pill><span className="block text-xs text-muted-foreground">{r.hours} hrs · {Number(r.hours) - Number(r.hours_used)} left · {usd(r.price_cents)} · {r.email}</span></>} />;
}

function Report() {
  const { data: rentals = [] } = useTable("rentals");
  const live = rentals.filter((r) => r.status !== "canceled");
  const hrs = (r: { starts_at: string; ends_at: string }) => (new Date(r.ends_at).getTime() - new Date(r.starts_at).getTime()) / 36e5;
  const months = lastMonths(6);
  const byMonth = months.map((m) => ({ m, h: live.filter((r) => dk(r.starts_at).startsWith(m)).reduce((a, r) => a + hrs(r), 0) }));
  const max = Math.max(1, ...byMonth.map((x) => x.h));
  const renters = Object.entries(live.reduce<Record<string, number>>((a, r) => ({ ...a, [r.renter]: (a[r.renter] ?? 0) + r.quote_cents }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const byType = (Object.keys(RENTAL_TYPES) as RentalType[]).map((t) => ({ t, c: live.filter((r) => r.rental_type === t).reduce((a, r) => a + r.quote_cents, 0) }));
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border bg-card p-5"><h3 className="font-semibold">Booked hours / month</h3>
        <ul className="mt-3 space-y-1.5 text-sm">{byMonth.map((x) => <li key={x.m} className="flex items-center gap-2"><span className="w-16 font-mono text-xs">{x.m}</span><span className="h-2 rounded bg-gold" style={{ width: `${(x.h / max) * 100}%`, minWidth: 2 }} /><span>{x.h.toFixed(1)}</span></li>)}</ul></div>
      <div className="rounded-3xl border bg-card p-5"><h3 className="font-semibold">Top renters</h3>
        <ol className="mt-3 space-y-1 text-sm">{renters.map(([n, c]) => <li key={n} className="flex justify-between"><span>{n}</span><span>{usd(c)}</span></li>)}{!renters.length && <li className="text-muted-foreground">No rentals yet.</li>}</ol></div>
      <div className="rounded-3xl border bg-card p-5"><h3 className="font-semibold">Revenue by rental type</h3>
        <ul className="mt-3 space-y-1 text-sm">{byType.map((x) => <li key={x.t} className="flex justify-between"><span>{RENTAL_TYPES[x.t].label}</span><span>{usd(x.c)}</span></li>)}</ul></div>
    </div>
  );
}

const money: [keyof RentalSettings, string][] = [
  ["podcast_hourly_cents", "Podcast / video per hour"], ["package_hourly_cents", "Podcast package per hour"],
  ["half_day_cents", "Half day (4 hrs)"], ["full_day_cents", "Full day (8 hrs)"], ["operator_hourly_cents", "Extra operator per hour"],
  ["edited_video_cents", "Edited video package"], ["shuttle_cents", "Shuttle add-on"], ["setup_hourly_cents", "Extra setup per hour"],
  ["security_deposit_cents", "Security deposit"],
];
const nums: [keyof RentalSettings, string][] = [["deposit_pct", "Deposit %"], ["max_capacity", "Max people"], ["pack_hours", "Hours per pack"], ["pack_discount_pct", "Pack discount %"]];

function Settings() {
  const qc = useQueryClient();
  const { data } = useRentalSettings();
  const [f, setF] = useState<RentalSettings | null>(null);
  const v = f ?? data;
  if (!v) return null;
  async function save() {
    if (!f) return;
    const { error } = await supabase.from("rental_settings").update(f).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Rental prices saved");
    setF(null); qc.invalidateQueries({ queryKey: ["rental-settings"] });
  }
  return (
    <div className="mt-3 grid gap-3 rounded-3xl border bg-card p-5 sm:grid-cols-3 lg:grid-cols-4">
      {money.map(([k, l]) => <div key={k}><Label>{l}</Label><Input className="mt-1" type="number" min={0} step="0.01" value={v[k] / 100} onChange={(e) => setF({ ...v, [k]: Math.round(Number(e.target.value) * 100) })} /></div>)}
      {nums.map(([k, l]) => <div key={k}><Label>{l}</Label><Input className="mt-1" type="number" min={0} value={v[k]} onChange={(e) => setF({ ...v, [k]: Number(e.target.value) })} /></div>)}
      <Button variant="gold" className="self-end" disabled={!f} onClick={save}>Save prices</Button>
    </div>
  );
}
