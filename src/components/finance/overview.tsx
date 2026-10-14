import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { STREAMS, lastMonths, monthKey, rentCoveredPct, sumWhere, usd, DEFAULT_FUNDRAISING_GOAL_CENTS } from "@/lib/finance";
import { useTable } from "./crud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const financeSettingsQuery = {
  queryKey: ["fin", "settings"],
  queryFn: async () => (await supabase.from("finance_settings").select("*").eq("id", 1).maybeSingle()).data ?? { id: 1, fundraising_goal_cents: DEFAULT_FUNDRAISING_GOAL_CENTS, monthly_operating_cents: 0 },
};

function Meter({ label, value, max, note }: { label: string; value: number; max: number; note?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="rounded-3xl border bg-card p-5">
      <div className="flex items-baseline justify-between"><p className="eyebrow">{label}</p><p className="font-display text-2xl text-walnut">{pct}%</p></div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full bg-gold-gradient" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{usd(value)} of {usd(max)}{note ? ` · ${note}` : ""}</p>
    </div>
  );
}

export function Overview() {
  const qc = useQueryClient();
  const { data: income = [] } = useTable("income", "received_on");
  const { data: expenses = [] } = useTable("expenses", "spent_on");
  const { data: campaigns = [] } = useTable("campaigns");
  const { data: s } = useQuery(financeSettingsQuery);
  const [edit, setEdit] = useState<{ goal: string; op: string } | null>(null);

  const months = lastMonths(12);
  const thisM = months[11]!, lastM = months[10]!;
  const inc = (m: string) => sumWhere(income, (r) => monthKey(r.received_on) === m);
  const exp = (m: string) => sumWhere(expenses, (r) => monthKey(r.spent_on) === m);
  const series = months.map((m) => ({ month: m.slice(2), Income: inc(m) / 100, Expenses: exp(m) / 100, Net: (inc(m) - exp(m)) / 100 }));
  const year = new Date().getFullYear().toString();
  const raised = sumWhere(income, (r) => r.stream === "donations" && r.received_on.startsWith(year));

  async function saveSettings() {
    if (!edit) return;
    const { error } = await supabase.from("finance_settings").update({ fundraising_goal_cents: Math.round(Number(edit.goal) * 100), monthly_operating_cents: Math.round(Number(edit.op) * 100) }).eq("id", 1);
    if (error) return toast.error(error.message);
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["fin", "settings"] });
  }

  const cmp = [
    { l: "Income", a: inc(thisM), b: inc(lastM) },
    { l: "Expenses", a: exp(thisM), b: exp(lastM) },
    { l: "Net", a: inc(thisM) - exp(thisM), b: inc(lastM) - exp(lastM) },
  ];

  return (
    <div className="space-y-8 py-4">
      <div className="grid gap-3 md:grid-cols-3">
        {cmp.map((c) => (
          <div key={c.l} className="rounded-3xl bg-stage p-5 text-stage-foreground">
            <p className="eyebrow text-gold">{c.l} · this month</p>
            <p className="mt-1 font-display text-4xl">{usd(c.a)}</p>
            <p className="mt-1 text-sm text-stage-foreground/80">Last month {usd(c.b)} · {c.a >= c.b ? "▲" : "▼"} {usd(Math.abs(c.a - c.b))}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Meter label="Rent covered (this month)" value={inc(thisM)} max={s?.monthly_operating_cents ?? 0} note={rentCoveredPct(inc(thisM), s?.monthly_operating_cents ?? 0) >= 100 ? "fully covered" : "monthly operating costs"} />
        <Meter label={`Fundraising goal ${year}`} value={raised} max={s?.fundraising_goal_cents ?? DEFAULT_FUNDRAISING_GOAL_CENTS} />
      </div>
      {edit ? (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-secondary p-4">
          <div><Label htmlFor="goal">Fundraising goal ($)</Label><Input id="goal" type="number" value={edit.goal} onChange={(e) => setEdit({ ...edit, goal: e.target.value })} /></div>
          <div><Label htmlFor="op">Monthly operating costs ($)</Label><Input id="op" type="number" value={edit.op} onChange={(e) => setEdit({ ...edit, op: e.target.value })} /></div>
          <Button variant="gold" onClick={saveSettings}>Save</Button>
          <Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setEdit({ goal: String((s?.fundraising_goal_cents ?? 0) / 100), op: String((s?.monthly_operating_cents ?? 0) / 100) })}>Edit goal & operating costs</Button>
      )}

      <div>
        <h3 className="text-xl font-semibold">Income by stream · this month</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(STREAMS).map(([k, l]) => (
            <div key={k} className="rounded-2xl bg-secondary p-4">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="font-display text-2xl text-walnut">{usd(sumWhere(income, (r) => r.stream === k && monthKey(r.received_on) === thisM))}</p>
            </div>
          ))}
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.filter((c) => c.active).map((c) => (
            <Meter key={c.id} label={`Campaign · ${c.name}`} value={sumWhere(income, (r) => r.campaign_id === c.id)} max={c.goal_cents} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5">
          <h3 className="text-lg font-semibold">Income & expenses by month</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer><BarChart data={series}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend /><Bar dataKey="Income" fill="var(--gold)" /><Bar dataKey="Expenses" fill="var(--walnut)" /></BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <h3 className="text-lg font-semibold">12-month net trend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer><LineChart data={series}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line type="monotone" dataKey="Net" stroke="var(--gold)" strokeWidth={2} /><Line type="monotone" dataKey="Income" stroke="var(--success)" strokeWidth={1} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
