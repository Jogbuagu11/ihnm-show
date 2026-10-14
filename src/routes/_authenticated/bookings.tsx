import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usd } from "@/lib/finance";
import { RENTAL_TYPES, refundPct, type RentalType } from "@/lib/rentals";
import { LOCATION } from "@/lib/show";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — Studio A" },
      { name: "description", content: "Your Studio A rentals, invoices and hour packs." },
      { property: "og:title", content: "My Bookings — Studio A" },
      { property: "og:description", content: "Your Studio A rentals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Bookings,
});

const TZ = "America/Los_Angeles";
const when = (a: string, b: string) => `${new Date(a).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ })} – ${new Date(b).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })}`;
const label: Record<string, string> = { deposit_due: "Deposit due", booked: "Confirmed", tentative: "On hold", completed: "Completed", canceled: "Canceled" };

function Bookings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["my-rentals"],
    queryFn: async () => {
      const [r, p] = await Promise.all([
        supabase.from("rentals").select("*, invoices(number,amount_cents,due_on,status,pay_url)").order("starts_at", { ascending: false }),
        supabase.from("hour_packs").select("*").order("created_at", { ascending: false }),
      ]);
      return { rentals: r.data ?? [], packs: p.data ?? [] };
    },
  });
  const rentals = data?.rentals ?? [];
  const now = new Date();
  const upcoming = rentals.filter((r) => new Date(r.ends_at) > now && r.status !== "canceled").reverse();
  const past = rentals.filter((r) => !(new Date(r.ends_at) > now && r.status !== "canceled"));

  async function cancel(id: string) {
    const { data: pct, error } = await supabase.rpc("cancel_my_rental", { _rental: id });
    if (error) return toast.error(error.message);
    toast.success(`Booking canceled — ${pct}% of your deposit will be refunded.`);
    qc.invalidateQueries({ queryKey: ["my-rentals"] });
  }

  type R = (typeof rentals)[number];
  const Card = ({ r, isPast }: { r: R; isPast?: boolean }) => {
    const inv = r.invoices as { number: string; amount_cents: number; due_on: string; status: string; pay_url: string | null } | null;
    return (
      <li className="rounded-3xl border bg-card p-5">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">{when(r.starts_at, r.ends_at)} PT · {label[r.status] ?? r.status}</p>
        <h3 className="mt-1 font-display text-2xl">{RENTAL_TYPES[r.rental_type as RentalType]?.label ?? r.rental_type}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{LOCATION} · {r.headcount} people · total {usd(r.quote_cents)} · deposit {usd(r.deposit_cents)} {r.deposit_paid ? "paid" : "due"} · security {usd(r.security_deposit_cents)} ({r.security_status})</p>
        {inv && <p className="mt-1 text-sm">Balance invoice {inv.number}: {usd(inv.amount_cents)} due {inv.due_on} — {r.balance_paid ? "paid" : inv.status}{inv.pay_url && !r.balance_paid && <> · <a className="underline decoration-gold" href={inv.pay_url} target="_blank" rel="noreferrer">Pay online</a></>}</p>}
        {r.status === "canceled" && r.refund_pct != null && <p className="mt-1 text-sm">Refund: {r.refund_pct}% of payments made.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {!isPast && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button size="sm" variant="outline">Cancel booking</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>Based on the date, you'd get a {refundPct(new Date(r.starts_at))}% refund. Full refund 7+ days out, 50% within 7 days, none within 48 hours.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction onClick={() => cancel(r.id)}>Cancel booking</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button asChild size="sm" variant="gold"><Link to="/rent" hash="book">Rebook</Link></Button>
        </div>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="eyebrow">Studio A</p>
      <h1 className="text-4xl">My <span className="italic-gold">Bookings</span></h1>
      <h2 className="mt-8 text-2xl">Upcoming</h2>
      <ul className="mt-3 grid gap-3">{upcoming.map((r) => <Card key={r.id} r={r} />)}{!upcoming.length && <li className="text-muted-foreground">No upcoming rentals. <Link to="/rent" className="underline decoration-gold">Book Studio A</Link></li>}</ul>
      {(data?.packs.length ?? 0) > 0 && <>
        <h2 className="mt-10 text-2xl">Hour packs</h2>
        <ul className="mt-3 grid gap-2">{data!.packs.map((p) => <li key={p.id} className="rounded-2xl border bg-card p-4 text-sm">{p.hours} hours · {usd(p.price_cents)} · {p.status === "paid" ? `${Number(p.hours) - Number(p.hours_used)} hours left` : p.status === "pending" ? "awaiting payment" : p.status}</li>)}</ul>
      </>}
      {past.length > 0 && <><h2 className="mt-10 text-2xl">Past & canceled</h2><ul className="mt-3 grid gap-3">{past.map((r) => <Card key={r.id} r={r} isPast />)}</ul></>}
    </div>
  );
}
