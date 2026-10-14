import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Generic, loosely-typed access for the admin ledger tables (all admin-only via RLS).
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Q = { data: Row[] | null; error: { message: string } | null };
type Builder = PromiseLike<Q> & { order: (c: string, o?: object) => Builder; eq: (c: string, v: unknown) => Builder };
export const db = supabase as unknown as {
  from: (t: string) => {
    select: (s?: string) => Builder;
    insert: (r: Row) => PromiseLike<Q>;
    update: (r: Row) => { eq: (c: string, v: unknown) => PromiseLike<Q> };
    delete: () => { eq: (c: string, v: unknown) => PromiseLike<Q> };
  };
};

export type Field = {
  k: string; label: string;
  type?: "text" | "email" | "money" | "number" | "date" | "datetime" | "select" | "bool" | "file" | "textarea";
  options?: readonly (string | { v: string; l: string })[];
  required?: boolean; def?: unknown; wide?: boolean;
};

export function useTable(table: string, order = "created_at") {
  return useQuery({
    queryKey: ["fin", table],
    queryFn: async () => {
      const { data, error } = await db.from(table).select("*").order(order, { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export async function openFile(path: string) {
  const { data, error } = await supabase.storage.from("finance").createSignedUrl(path, 300);
  if (error || !data) return toast.error("Could not open file");
  window.open(data.signedUrl, "_blank", "noopener");
}

function blank(fields: Field[]) {
  return Object.fromEntries(fields.map((f) => [f.k, f.def ?? (f.type === "bool" ? false : f.type === "select" ? optVal(f.options?.[0]) : "")]));
}
const optVal = (o?: string | { v: string; l: string }) => (o == null ? "" : typeof o === "string" ? o : o.v);
const optLabel = (o: string | { v: string; l: string }) => (typeof o === "string" ? o : o.l);

export function Crud({ table, title, fields, columns, actions, order }: {
  table: string; title: string; fields: Field[]; order?: string;
  columns: (r: Row) => ReactNode; actions?: (r: Row) => ReactNode;
}) {
  const qc = useQueryClient();
  const { data = [] } = useTable(table, order);
  const [f, setF] = useState<Row>(blank(fields));
  const [id, setId] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);

  function edit(r: Row) {
    const v: Row = {};
    for (const fd of fields) {
      const x = r[fd.k];
      v[fd.k] = fd.type === "money" ? (x ?? 0) / 100 : fd.type === "datetime" && x ? new Date(x).toISOString().slice(0, 16) : x ?? "";
    }
    setF(v); setId(r.id); setFiles({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    for (const fd of fields) if (fd.required && !String(f[fd.k] ?? "").trim()) return toast.error(`${fd.label} is required`);
    setBusy(true);
    try {
      const row: Row = {};
      for (const fd of fields) {
        const v = f[fd.k];
        if (fd.type === "file") {
          const file = files[fd.k];
          if (file) {
            const path = `${table}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
            const up = await supabase.storage.from("finance").upload(path, file);
            if (up.error) throw new Error(up.error.message);
            row[fd.k] = path;
          }
        } else if (fd.type === "money") row[fd.k] = Math.round(Number(v || 0) * 100);
        else if (fd.type === "number") row[fd.k] = Number(v || 0);
        else if (fd.type === "bool") row[fd.k] = !!v;
        else if (fd.type === "datetime") row[fd.k] = v ? new Date(v).toISOString() : null;
        else row[fd.k] = typeof v === "string" ? v.trim() || null : v;
      }
      const res = id ? await db.from(table).update(row).eq("id", id) : await db.from(table).insert(row);
      if (res.error) throw new Error(res.error.message);
      toast.success("Saved");
      setF(blank(fields)); setId(null); setFiles({});
      qc.invalidateQueries({ queryKey: ["fin"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally { setBusy(false); }
  }

  async function remove(r: Row) {
    if (!window.confirm("Delete this entry?")) return;
    const { error } = await db.from(table).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["fin"] });
  }

  return (
    <div className="grid gap-6 py-4 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={save} className="h-fit space-y-3 rounded-3xl border bg-card p-5">
        <h3 className="text-xl font-semibold">{id ? `Edit ${title}` : `New ${title}`}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((fd) => {
            const idf = `${table}-${fd.k}`;
            const common = { id: idf, value: f[fd.k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [fd.k]: e.target.value }) };
            return (
              <div key={fd.k} className={fd.wide || fd.type === "textarea" ? "sm:col-span-2" : ""}>
                {fd.type === "bool" ? (
                  <Label className="flex items-center gap-3 pt-6"><Switch checked={!!f[fd.k]} onCheckedChange={(v) => setF({ ...f, [fd.k]: v })} /> {fd.label}</Label>
                ) : (
                  <>
                    <Label htmlFor={idf}>{fd.label}{fd.type === "money" && " ($)"}</Label>
                    {fd.type === "select" ? (
                      <Select value={String(f[fd.k] ?? "")} onValueChange={(v) => setF({ ...f, [fd.k]: v })}>
                        <SelectTrigger id={idf}><SelectValue /></SelectTrigger>
                        <SelectContent>{fd.options?.map((o) => <SelectItem key={optVal(o)} value={optVal(o)} className="capitalize">{optLabel(o).replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : fd.type === "textarea" ? (
                      <Textarea {...common} maxLength={2000} />
                    ) : fd.type === "file" ? (
                      <Input id={idf} type="file" accept="application/pdf,image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setFiles({ ...files, [fd.k]: file }); }} />
                    ) : (
                      <Input {...common} maxLength={300} type={fd.type === "money" || fd.type === "number" ? "number" : fd.type === "datetime" ? "datetime-local" : fd.type ?? "text"} step={fd.type === "money" ? "0.01" : undefined} min={fd.type === "money" ? 0 : undefined} />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="gold" disabled={busy}>{id ? "Save changes" : "Add"}</Button>
          {id && <Button type="button" variant="ghost" onClick={() => { setF(blank(fields)); setId(null); }}>Cancel</Button>}
        </div>
      </form>
      <ul className="space-y-2">
        {data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary p-4 text-sm">
            <div className="min-w-0 flex-1">{columns(r)}</div>
            <div className="flex flex-wrap items-center gap-1">
              {actions?.(r)}
              {fields.filter((fd) => fd.type === "file" && r[fd.k]).map((fd) => (
                <Button key={fd.k} size="sm" variant="outline" onClick={() => openFile(r[fd.k])}><Paperclip /> {fd.label}</Button>
              ))}
              <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => edit(r)}><Pencil /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete" className="text-destructive" onClick={() => remove(r)}><Trash2 /></Button>
            </div>
          </li>
        ))}
        {data.length === 0 && <li className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Nothing here yet.</li>}
      </ul>
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "good" | "bad" | "warn" }) {
  const c = { muted: "bg-muted text-muted-foreground", good: "bg-success/15 text-success", bad: "bg-destructive/15 text-destructive", warn: "bg-blush text-blush-foreground" }[tone];
  return <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${c}`}>{children}</span>;
}
