import { useState } from "react";
import { Download } from "lucide-react";
import { STREAMS, EXPENSE_CATEGORIES, downloadCsv, monthKey, sumWhere, usd } from "@/lib/finance";
import { db, useTable } from "./crud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TABLES = ["income", "expenses", "partners", "campaigns", "sponsors", "sponsor_deliverables", "invoices", "rentals", "budgets"];

export function Reports() {
  const { data: income = [] } = useTable("income", "received_on");
  const { data: expenses = [] } = useTable("expenses", "spent_on");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [showPublic, setShowPublic] = useState(false);
  const match = (d: string) => (period.length === 4 ? d.startsWith(period) : monthKey(d) === period);
  const inc = Object.keys(STREAMS).map((k) => ({ k, v: sumWhere(income, (r) => r.stream === k && match(r.received_on)) }));
  const exp = EXPENSE_CATEGORIES.map((k) => ({ k, v: sumWhere(expenses, (r) => r.category === k && match(r.spent_on)) }));
  const ti = inc.reduce((a, x) => a + x.v, 0), te = exp.reduce((a, x) => a + x.v, 0);

  async function exportAll() {
    for (const t of TABLES) {
      const { data } = await db.from(t).select("*");
      downloadCsv(`ihnm-${t}.csv`, data ?? []);
    }
  }

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><Label htmlFor="period">Month (YYYY-MM) or year (YYYY)</Label><Input id="period" value={period} onChange={(e) => setPeriod(e.target.value.trim())} className="w-48" /></div>
        <Button variant="outline" onClick={() => setPeriod(new Date().getFullYear().toString())}>This year</Button>
        <Button variant="gold" onClick={exportAll}><Download /> Export everything (CSV)</Button>
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <h3 className="text-2xl font-semibold">Income statement · {period}</h3>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <table className="w-full text-sm"><caption className="eyebrow pb-2 text-left">Income</caption><tbody>
            {inc.map((x) => <tr key={x.k} className="border-b"><td className="py-1.5">{STREAMS[x.k as keyof typeof STREAMS]}</td><td className="text-right">{usd(x.v)}</td></tr>)}
            <tr className="font-semibold"><td className="py-2">Total income</td><td className="text-right">{usd(ti)}</td></tr>
          </tbody></table>
          <table className="w-full text-sm"><caption className="eyebrow pb-2 text-left">Expenses</caption><tbody>
            {exp.map((x) => <tr key={x.k} className="border-b"><td className="py-1.5 capitalize">{x.k}</td><td className="text-right">{usd(x.v)}</td></tr>)}
            <tr className="font-semibold"><td className="py-2">Total expenses</td><td className="text-right">{usd(te)}</td></tr>
          </tbody></table>
        </div>
        <p className={`mt-6 font-display text-3xl ${ti - te < 0 ? "text-destructive" : "text-walnut"}`}>Net {usd(ti - te)}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => downloadCsv(`income-statement-${period}.csv`, [...inc.map((x) => ({ type: "income", line: x.k, amount: x.v / 100 })), ...exp.map((x) => ({ type: "expense", line: x.k, amount: x.v / 100 }))])}><Download /> Download statement</Button>
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <div className="flex items-center justify-between"><h3 className="text-2xl font-semibold">Annual transparency report</h3><Button variant="outline" size="sm" onClick={() => setShowPublic(!showPublic)}>{showPublic ? "Hide" : "Generate"}</Button></div>
        {showPublic && (
          <div id="transparency" className="mt-4 space-y-3 rounded-2xl bg-secondary p-6">
            <p className="eyebrow">IHNM Show · {period.slice(0, 4)} · Where your support went</p>
            <p className="font-display text-3xl">We received {usd(sumWhere(income, (r) => r.received_on.startsWith(period.slice(0, 4))))} and invested it in the show.</p>
            <ul className="space-y-1 text-sm">
              {EXPENSE_CATEGORIES.map((k) => {
                const yr = sumWhere(expenses, (r) => r.spent_on.startsWith(period.slice(0, 4)));
                const v = sumWhere(expenses, (r) => r.category === k && r.spent_on.startsWith(period.slice(0, 4)));
                return v ? <li key={k} className="flex justify-between capitalize"><span>{k}</span><span>{Math.round((v / (yr || 1)) * 100)}%</span></li> : null;
              })}
            </ul>
            <p className="text-xs text-muted-foreground">Shows percentages only — no names or individual amounts. Print or save as PDF to share.</p>
            <Button size="sm" variant="gold" onClick={() => window.print()}>Print / save as PDF</Button>
          </div>
        )}
      </div>
    </div>
  );
}
