import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill } from "@/components/finance/crud";
import { WAITLIST_SOURCES, normalizeImportRow, parseCsv, toCsv } from "@/lib/waitlist";
import type { Database } from "@/integrations/supabase/types";

type Signup = Database["public"]["Tables"]["waitlist_signups"]["Row"];
type Stats = {
  total: number;
  confirmed: number;
  sms_opt_in: number;
  invited: number;
  ticketed: number;
  church_groups: number;
  per_day: { day: string; count: number }[];
  top_sources: { label: string; count: number }[];
  top_zips: { label: string; count: number }[];
  top_referrers: { label: string; email: string; code: string; count: number }[];
  churches: { label: string; count: number }[];
  top_utm: { label: string; count: number }[];
};

const EXPORT_COLUMNS = [
  "list_position",
  "first_name",
  "last_name",
  "email",
  "phone",
  "sms_opt_in",
  "zip",
  "source",
  "church_group",
  "church_name",
  "referral_code",
  "referral_count",
  "status",
  "confirmed_at",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "import_source",
  "created_at",
];

export function WaitlistAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [inviteN, setInviteN] = useState("25");
  const fileRef = useRef<HTMLInputElement>(null);
  const [importSource, setImportSource] = useState("substack");

  const { data: stats } = useQuery({
    queryKey: ["waitlist", "stats"],
    queryFn: async (): Promise<Stats> => {
      const { data, error } = await supabase.rpc("waitlist_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["waitlist", "rows"],
    queryFn: async (): Promise<Signup[]> => {
      const { data, error } = await supabase
        .from("waitlist_signups")
        .select("*")
        .order("list_position")
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Filtering stays client-side: the whole list is already loaded for export.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (source !== "all" && (r.source ?? "") !== source) return false;
      if (!q) return true;
      return [
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.zip,
        r.church_name,
        r.referral_code,
      ].some((v) => v?.toLowerCase().includes(q));
    });
  }, [rows, search, status, source]);

  const invite = useMutation({
    mutationFn: async (n: number) => {
      const { data, error } = await supabase.rpc("invite_top_waitlist", { p_count: n });
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: (invited) => {
      toast.success(
        invited.length
          ? `${invited.length} marked as invited.`
          : "Nobody new to invite — the top of the list is already invited.",
      );
      void qc.invalidateQueries({ queryKey: ["waitlist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const parsed = parseCsv(await file.text()).map(normalizeImportRow);
      const usable = parsed.filter((r) => r.email ?? r.phone);
      if (!usable.length) throw new Error("No email or phone column found in that file.");
      const { data, error } = await supabase.rpc("import_waitlist", {
        p_rows:
          usable as unknown as Database["public"]["Functions"]["import_waitlist"]["Args"]["p_rows"],
        p_source: importSource,
      });
      if (error) throw error;
      return data as unknown as { inserted: number; merged: number; skipped: number };
    },
    onSuccess: (r) => {
      toast.success(`Imported: ${r.inserted} new, ${r.merged} merged, ${r.skipped} skipped.`);
      void qc.invalidateQueries({ queryKey: ["waitlist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function exportCsv() {
    const csv = toCsv(filtered as unknown as Record<string, unknown>[], EXPORT_COLUMNS);
    if (!csv) return toast.error("Nothing to export.");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ihnm-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4 space-y-8">
      {/* Totals */}
      <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Signups", stats?.total],
          ["Confirmed", stats?.confirmed],
          ["Texts OK", stats?.sms_opt_in],
          ["Invited", stats?.invited],
          ["Ticketed", stats?.ticketed],
          ["Church groups", stats?.church_groups],
        ].map(([label, n]) => (
          <li key={String(label)} className="rounded-2xl border bg-card p-4">
            <p className="font-display text-4xl text-gold">{n ?? "—"}</p>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
              {label}
            </p>
          </li>
        ))}
      </ul>

      {/* Signups per day */}
      <section>
        <p className="eyebrow">— Signups per day</p>
        <div className="mt-3 h-56 rounded-2xl border bg-card p-4">
          {stats?.per_day?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.per_day}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No signups yet.</p>
          )}
        </div>
      </section>

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Breakdown title="Top sources" rows={stats?.top_sources} />
        <Breakdown title="Top ZIP codes" rows={stats?.top_zips} />
        <Breakdown title="Top UTM" rows={stats?.top_utm} />
        <Breakdown title="Church groups" rows={stats?.churches} />
      </div>

      <section>
        <p className="eyebrow">— Top referrers</p>
        <ul className="mt-3 divide-y rounded-2xl border bg-card">
          {stats?.top_referrers?.length ? (
            stats.top_referrers.map((r) => (
              <li
                key={r.code}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span>
                  {r.label} <span className="text-muted-foreground">· {r.email}</span>
                </span>
                <Pill tone="good">{r.count} referred</Pill>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-muted-foreground">No referrals yet.</li>
          )}
        </ul>
      </section>

      {/* Invite + import */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <p className="eyebrow">— Early access</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Marks the top confirmed people as invited. Emails send once a transactional sender is
            configured.
          </p>
          <div className="mt-3 flex items-end gap-2">
            <div className="w-28">
              <Label htmlFor="invite-n">How many</Label>
              <Input
                id="invite-n"
                className="mt-1"
                inputMode="numeric"
                value={inviteN}
                onChange={(e) => setInviteN(e.target.value)}
              />
            </div>
            <Button
              variant="gold"
              disabled={invite.isPending}
              onClick={() => {
                const n = Number(inviteN);
                if (!Number.isInteger(n) || n < 1)
                  return toast.error("Enter a whole number of people.");
                invite.mutate(n);
              }}
            >
              <Users className="size-4" aria-hidden /> Invite top {inviteN || "N"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <p className="eyebrow">— Import CSV</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Merges by email, then phone, so nobody is added twice. Tagged with the source you pick.
          </p>
          <div className="mt-3 flex items-end gap-2">
            <div className="w-40">
              <Label htmlFor="import-src">Tag as</Label>
              <Select value={importSource} onValueChange={setImportSource}>
                <SelectTrigger id="import-src" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="substack">Substack</SelectItem>
                  <SelectItem value="sms">SMS tool</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={importCsv.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden />{" "}
              {importCsv.isPending ? "Importing…" : "Choose file"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv.mutate(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </section>

      {/* Table */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="eyebrow">— All signups ({filtered.length})</p>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" aria-hidden /> Export CSV
          </Button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div>
            <Label htmlFor="wl-search">Search</Label>
            <Input
              id="wl-search"
              className="mt-1"
              placeholder="Name, email, phone, ZIP, code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="wl-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="wl-status" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["all", "waitlist", "invited", "ticketed"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="wl-source">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="wl-source" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {WAITLIST_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-secondary/60 text-left font-mono text-[0.65rem] uppercase tracking-[0.15em]">
              <tr>
                <th scope="col" className="px-3 py-2">
                  #
                </th>
                <th scope="col" className="px-3 py-2">
                  Name
                </th>
                <th scope="col" className="px-3 py-2">
                  Email
                </th>
                <th scope="col" className="px-3 py-2">
                  ZIP
                </th>
                <th scope="col" className="px-3 py-2">
                  Source
                </th>
                <th scope="col" className="px-3 py-2">
                  Refs
                </th>
                <th scope="col" className="px-3 py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.slice(0, 500).map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 tabular-nums">{r.list_position}</td>
                  <td className="px-3 py-2">
                    {r.first_name} {r.last_name}
                    {r.church_group && (
                      <span className="block text-xs text-muted-foreground">{r.church_name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.zip ?? "—"}</td>
                  <td className="px-3 py-2">{r.source ?? r.import_source ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{r.referral_count}</td>
                  <td className="px-3 py-2">
                    <Pill
                      tone={
                        r.status === "ticketed" ? "good" : r.status === "invited" ? "warn" : "muted"
                      }
                    >
                      {r.status}
                    </Pill>
                    {!r.confirmed_at && <Pill tone="bad">unconfirmed</Pill>}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No matching signups.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 500 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing the first 500 of {filtered.length}. Export for the full list.
          </p>
        )}
      </section>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[] | undefined;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {rows?.length ? (
          rows.map((r) => (
            <li key={r.label} className="flex justify-between gap-2">
              <span className="truncate">{r.label}</span>
              <span className="tabular-nums text-muted-foreground">{r.count}</span>
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">—</li>
        )}
      </ul>
    </div>
  );
}
