import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { EXPENSE_CATEGORIES, STREAMS, invoiceStatus, monthKey, needsRenewal, sumWhere, usd } from "@/lib/finance";
import { fmtShortDate } from "@/lib/show";
import { Crud, Pill, useTable, type Field } from "@/components/finance/crud";
import { Overview } from "@/components/finance/overview";
import { Reports } from "@/components/finance/reports";
import { StudioAdmin } from "@/components/finance/studio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Finance — IHNM Show Admin" },
      { name: "description", content: "Admin finance portal for IHNM Show." },
      { property: "og:title", content: "Finance — IHNM Show Admin" },
      { property: "og:description", content: "Admin finance tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Finance,
});

const streamOpts = Object.entries(STREAMS).map(([v, l]) => ({ v, l }));
const status3 = ["active", "paused", "canceled"] as const;
const d = (x?: string | null) => (x ? fmtShortDate(x + "T12:00:00Z") : "—");
const tone = (s: string) => (s === "paid" || s === "active" ? "good" : s === "overdue" || s === "canceled" ? "bad" : s === "sent" || s === "paused" ? "warn" : "muted");

function Finance() {
  const { roles, loading } = useAuth();
  if (loading) return null;
  if (!roles.includes("admin")) return <div className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="text-3xl">Admins only</h1><p className="mt-2 text-muted-foreground">The finance portal is limited to admin accounts.</p></div>;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="eyebrow">Admin</p>
      <h1 className="text-4xl">Finance <span className="italic-gold">Portal</span></h1>
      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {["dashboard", "income", "partners", "sponsors", "invoices", "rentals", "expenses", "reports"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "partners" ? "Fundraising & Partners" : t === "rentals" ? "Studio Rentals" : t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="dashboard"><Overview /></TabsContent>
        <TabsContent value="income"><IncomeTab /></TabsContent>
        <TabsContent value="partners"><PartnersTab /></TabsContent>
        <TabsContent value="sponsors"><SponsorsTab /></TabsContent>
        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        <TabsContent value="rentals"><RentalsTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="reports"><Reports /></TabsContent>
      </Tabs>
    </div>
  );
}

function useOpts(table: string, label: string) {
  const { data = [] } = useTable(table);
  return [{ v: "", l: "— none —" }, ...data.map((r) => ({ v: r.id as string, l: r[label] as string }))];
}

function IncomeTab() {
  const campaigns = useOpts("campaigns", "name");
  const partners = useOpts("partners", "name");
  const sponsors = useOpts("sponsors", "business");
  const fields: Field[] = [
    { k: "stream", label: "Stream", type: "select", options: streamOpts },
    { k: "amount_cents", label: "Amount", type: "money", required: true },
    { k: "received_on", label: "Received", type: "date", def: new Date().toISOString().slice(0, 10) },
    { k: "campaign_id", label: "Campaign", type: "select", options: campaigns },
    { k: "partner_id", label: "Partner (for donations)", type: "select", options: partners },
    { k: "sponsor_id", label: "Sponsor", type: "select", options: sponsors },
    { k: "memo", label: "Memo (e.g. YouTube payout, merch sale)", wide: true },
  ];
  return <Crud table="income" title="income" order="received_on" fields={fields} columns={(r) => <><span className="font-semibold">{usd(r.amount_cents)}</span> · {STREAMS[r.stream as keyof typeof STREAMS] ?? r.stream}<span className="block text-xs text-muted-foreground">{d(r.received_on)}{r.memo ? ` · ${r.memo}` : ""}</span></>} />;
}

function PartnersTab() {
  const campaigns = useOpts("campaigns", "name");
  const { data: income = [] } = useTable("income");
  return (
    <>
      <div className="mt-4 rounded-2xl border border-gold/50 bg-secondary p-4 text-sm">Online card giving isn't switched on yet. Record gifts here; each payment is logged under the Income tab as "Partners / Donations".</div>
      <h2 className="mt-6 text-2xl">Partners</h2>
      <Crud table="partners" title="partner" fields={[
        { k: "name", label: "Name", required: true }, { k: "email", label: "Email", type: "email" },
        { k: "amount_cents", label: "Amount", type: "money" }, { k: "frequency", label: "Frequency", type: "select", options: ["monthly", "one_time"] },
        { k: "start_date", label: "Start date", type: "date", def: new Date().toISOString().slice(0, 10) }, { k: "status", label: "Status", type: "select", options: status3 },
        { k: "campaign_id", label: "Campaign", type: "select", options: campaigns },
      ]} columns={(r) => <><span className="font-semibold">{r.name}</span><Pill tone={tone(r.status)}>{r.status}</Pill><span className="block text-xs text-muted-foreground">{usd(r.amount_cents)} {r.frequency === "monthly" ? "/ month" : "one-time"} · since {d(r.start_date)}{r.email ? ` · ${r.email}` : ""}</span></>}
        actions={(r) => r.email ? <Button size="sm" variant="outline" onClick={() => statement(r, income)}>Year-end statement</Button> : null} />
      <h2 className="mt-10 text-2xl">Campaigns</h2>
      <Crud table="campaigns" title="campaign" fields={[
        { k: "name", label: "Name (e.g. Studio Build)", required: true }, { k: "goal_cents", label: "Goal", type: "money" },
        { k: "active", label: "Active", type: "bool", def: true }, { k: "description", label: "Description", type: "textarea" },
      ]} columns={(r) => { const raised = sumWhere(income, (i) => i.campaign_id === r.id); return <><span className="font-semibold">{r.name}</span>{!r.active && <Pill>ended</Pill>}<span className="block text-xs text-muted-foreground">{usd(raised)} of {usd(r.goal_cents)}</span></>; }} />
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statement(p: any, income: any[]) {
  const yr = new Date().getFullYear() - (new Date().getMonth() < 2 ? 1 : 0);
  const gifts = income.filter((i) => i.partner_id === p.id && String(i.received_on).startsWith(String(yr)));
  const total = gifts.reduce((a, g) => a + g.amount_cents, 0);
  const lines = gifts.map((g) => `${g.received_on}  ${usd(g.amount_cents)}`).join("%0D%0A");
  window.location.href = `mailto:${p.email}?subject=${encodeURIComponent(`Your ${yr} giving statement — IHNM Show`)}&body=Dear ${encodeURIComponent(p.name)},%0D%0A%0D%0AThank you for partnering with IHNM Show. Your total giving in ${yr} was ${encodeURIComponent(usd(total))}.%0D%0A%0D%0A${lines}%0D%0A%0D%0AWith gratitude,%0D%0AIHNM Show`;
}

function SponsorsTab() {
  const episodes = useOpts("episodes", "title");
  const sponsors = useOpts("sponsors", "business");
  return (
    <>
      <Crud table="sponsors" title="sponsor" fields={[
        { k: "business", label: "Business", required: true }, { k: "contact", label: "Contact" }, { k: "email", label: "Email", type: "email" },
        { k: "package", label: "Package" }, { k: "price_cents", label: "Price", type: "money" },
        { k: "status", label: "Status", type: "select", options: ["active", "pending", "ended"] },
        { k: "start_date", label: "Start", type: "date" }, { k: "end_date", label: "End", type: "date" },
        { k: "agreement_path", label: "Signed agreement (PDF)", type: "file", wide: true },
      ]} columns={(r) => <><span className="font-semibold">{r.business}</span><Pill tone={tone(r.status)}>{r.status}</Pill>{needsRenewal(r.end_date) && <Pill tone="warn">renew soon</Pill>}<span className="block text-xs text-muted-foreground">{r.package ?? "—"} · {usd(r.price_cents)} · {d(r.start_date)} → {d(r.end_date)}{r.contact ? ` · ${r.contact}` : ""}</span></>}
        actions={(r) => r.email ? <Button asChild size="sm" variant="outline"><a href={`mailto:${r.email}?subject=${encodeURIComponent("Your IHNM Show sponsorship recap")}`}>Recap email</a></Button> : null} />
      <h2 className="mt-10 text-2xl">Deliverables per episode</h2>
      <Crud table="sponsor_deliverables" title="deliverable" fields={[
        { k: "sponsor_id", label: "Sponsor", type: "select", options: sponsors.slice(1), required: true },
        { k: "episode_id", label: "Episode", type: "select", options: episodes },
        { k: "mention_made", label: "Mention made", type: "bool" }, { k: "logo_shown", label: "Logo shown", type: "bool" },
        { k: "clip_posted", label: "Clip posted", type: "bool" }, { k: "notes", label: "Notes (views, clip links)", type: "textarea" },
      ]} columns={(r) => <><span className="font-semibold">{sponsors.find((s) => s.v === r.sponsor_id)?.l}</span> · {episodes.find((e) => e.v === r.episode_id)?.l ?? "No episode"}<span className="block text-xs">{["mention_made", "logo_shown", "clip_posted"].map((k) => <span key={k} className={r[k] ? "mr-3 text-success" : "mr-3 text-muted-foreground"}>{r[k] ? "✓" : "○"} {k.replace("_", " ")}</span>)}</span></>} />
    </>
  );
}

function InvoicesTab() {
  return (
    <>
      <div className="mt-4 rounded-2xl border border-gold/50 bg-secondary p-4 text-sm">Invoices are tracked here. Paste a payment link into "Pay-online link" and it shows on the invoice; online invoicing with automatic reminders turns on once payments are set up.</div>
      <Crud table="invoices" title="invoice" fields={[
        { k: "client_name", label: "Client", required: true }, { k: "email", label: "Email", type: "email" },
        { k: "kind", label: "Type", type: "select", options: ["sponsor", "rental", "studio_rental", "worship_video", "church_group"] },
        { k: "amount_cents", label: "Amount", type: "money", required: true },
        { k: "issued_on", label: "Issued", type: "date", def: new Date().toISOString().slice(0, 10) },
        { k: "due_on", label: "Due", type: "date", def: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10) },
        { k: "status", label: "Status", type: "select", options: ["draft", "sent", "paid"] }, { k: "paid_on", label: "Paid on", type: "date" },
        { k: "pay_url", label: "Pay-online link", wide: true }, { k: "description", label: "Description", type: "textarea" },
      ]} columns={(r) => { const st = invoiceStatus(r as { status: string; due_on: string }); return <><span className="font-semibold">{r.number}</span> · {r.client_name}<Pill tone={tone(st)}>{st}</Pill><span className="block text-xs capitalize text-muted-foreground">{usd(r.amount_cents)} · {String(r.kind).replace("_", " ")} · due {d(r.due_on)}</span></>; }}
        actions={(r) => r.email ? <Button asChild size="sm" variant="outline"><a href={`mailto:${r.email}?subject=${encodeURIComponent(`${invoiceStatus(r as { status: string; due_on: string }) === "overdue" ? "Reminder: " : ""}Invoice ${r.number} from IHNM Show`)}&body=${encodeURIComponent(`Hi ${r.client_name},\n\nInvoice ${r.number} for ${usd(r.amount_cents)} is due ${r.due_on}.${r.pay_url ? `\nPay online: ${r.pay_url}` : ""}\n\nThank you,\nIHNM Show`)}`}>{invoiceStatus(r as { status: string; due_on: string }) === "overdue" ? "Send reminder" : "Email"}</a></Button> : null} />
    </>
  );
}

function RentalsTab() {
  return <StudioAdmin />;
}

function ExpensesTab() {
  const { data: expenses = [] } = useTable("expenses", "spent_on");
  const { data: budgets = [] } = useTable("budgets", "category");
  const m = new Date().toISOString().slice(0, 7);
  return (
    <>
      <div className="mt-4 rounded-3xl border bg-card p-5">
        <h3 className="text-lg font-semibold">Budget vs. actual · this month</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {EXPENSE_CATEGORIES.map((c) => {
            const actual = sumWhere(expenses, (e) => e.category === c && monthKey(e.spent_on) === m);
            const b = budgets.find((x) => x.category === c)?.monthly_cents ?? 0;
            const over = b > 0 && actual > b;
            return <li key={c} className={`rounded-xl p-3 text-sm ${over ? "bg-destructive/15 text-destructive" : "bg-secondary"}`}><p className="font-semibold capitalize">{c}{over && " · over budget"}</p><p>{usd(actual)} of {usd(b)}</p></li>;
          })}
        </ul>
      </div>
      <Crud table="expenses" title="expense" order="spent_on" fields={[
        { k: "category", label: "Category", type: "select", options: EXPENSE_CATEGORIES }, { k: "amount_cents", label: "Amount", type: "money", required: true },
        { k: "spent_on", label: "Date", type: "date", def: new Date().toISOString().slice(0, 10) }, { k: "vendor", label: "Vendor" },
        { k: "receipt_path", label: "Receipt photo", type: "file" }, { k: "memo", label: "Memo", type: "textarea" },
      ]} columns={(r) => <><span className="font-semibold">{usd(r.amount_cents)}</span> · <span className="capitalize">{r.category}</span><span className="block text-xs text-muted-foreground">{d(r.spent_on)}{r.vendor ? ` · ${r.vendor}` : ""}</span></>} />
      <h2 className="mt-10 text-2xl">Monthly budgets</h2>
      <BudgetEditor budgets={budgets} />
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BudgetEditor({ budgets }: { budgets: any[] }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-3">
      {budgets.map((b) => <BudgetRow key={b.category} category={b.category} cents={b.monthly_cents} />)}
    </ul>
  );
}
function BudgetRow({ category, cents }: { category: string; cents: number }) {
  const qc = useQueryClient();
  const [v, setV] = useState(String(cents / 100));
  async function save() {
    const { error } = await supabase.from("budgets").update({ monthly_cents: Math.round(Number(v || 0) * 100) }).eq("category", category);
    if (error) return toast.error(error.message);
    toast.success("Budget saved");
    qc.invalidateQueries({ queryKey: ["fin"] });
  }
  return (
    <li className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-sm">
      <label htmlFor={`b-${category}`} className="w-24 capitalize">{category}</label>
      <Input id={`b-${category}`} type="number" min={0} value={v} onChange={(e) => setV(e.target.value)} onBlur={save} />
    </li>
  );
}
