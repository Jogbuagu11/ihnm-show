import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldBan, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill } from "@/components/finance/crud";
import { fmtShortDate } from "@/lib/show";

type Scope = "audience" | "volunteer" | "both";
const SCOPES: { v: Scope; l: string; hint: string }[] = [
  { v: "audience", l: "Audience", hint: "Cannot book a seat." },
  { v: "volunteer", l: "Volunteer", hint: "Cannot sign up or claim shifts." },
  { v: "both", l: "Both", hint: "Cannot book a seat or volunteer." },
];

/** Blocking someone who has been dismissed. Blocks are by email as well as by
 *  account, because signing up again is the obvious way around one. */
export function BlocksAdmin() {
  const qc = useQueryClient();
  const key = ["crew", "blocks"];
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState<Scope>("both");
  const [reason, setReason] = useState("");
  const [dismissedOn, setDismissedOn] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("person_blocks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("block_person", {
        _user_id: undefined as unknown as string,
        _email: email.trim().toLowerCase(),
        _scope: scope,
        _reason: reason.trim(),
        ...(dismissedOn ? { _dismissed_on: dismissedOn } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Blocked.");
      setEmail("");
      setReason("");
      setDismissedOn("");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("reason_required")
          ? "Please write a reason — the person is shown it when they try to book."
          : e.message.includes("admin_only")
            ? "Admins only."
            : "Could not block that person.",
      ),
  });

  const lift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("lift_block", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Block lifted.");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: () => toast.error("Could not lift that block."),
  });

  const live = rows.filter((r) => !r.lifted_at);
  const past = rows.filter((r) => r.lifted_at);

  return (
    <div className="mt-4 space-y-8">
      <section className="rounded-2xl border bg-card p-4">
        <p className="eyebrow">— Block someone</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Blocking by email also catches a new account signed up with the same address. The reason
          is shown to the person when they try to book, so write it as something they can be told.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <div>
            <Label htmlFor="bl-email">Email</Label>
            <Input
              id="bl-email"
              type="email"
              required
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bl-scope">Blocked from</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <SelectTrigger id="bl-scope" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPES.map((s) => (
                  <SelectItem key={s.v} value={s.v}>
                    {s.l} — {s.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bl-date">Date dismissed</Label>
            <Input
              id="bl-date"
              type="date"
              className="mt-1"
              value={dismissedOn}
              onChange={(e) => setDismissedOn(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="bl-reason">Reason</Label>
            <Textarea
              id="bl-reason"
              required
              rows={2}
              maxLength={500}
              className="mt-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button variant="gold" className="sm:col-span-2" disabled={add.isPending}>
            <ShieldBan className="size-4" aria-hidden />
            {add.isPending ? "Blocking…" : "Block this person"}
          </Button>
        </form>
      </section>

      <section>
        <p className="eyebrow">— Currently blocked ({live.length})</p>
        <ul className="mt-3 divide-y rounded-2xl border bg-card">
          {live.map((b) => (
            <li key={b.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{b.email ?? "(account)"}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{b.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Blocked {fmtShortDate(b.created_at)}
                  {b.dismissed_on ? ` · dismissed ${b.dismissed_on}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone="bad">{b.scope}</Pill>
                <Button size="sm" variant="outline" onClick={() => lift.mutate(b.id)}>
                  <Undo2 className="size-4" aria-hidden /> Lift
                </Button>
              </div>
            </li>
          ))}
          {live.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">Nobody is blocked.</li>
          )}
        </ul>
      </section>

      {past.length > 0 && (
        <section>
          <p className="eyebrow">— Lifted ({past.length})</p>
          <ul className="mt-3 divide-y rounded-2xl border bg-card text-sm">
            {past.map((b) => (
              <li key={b.id} className="flex justify-between gap-3 p-4">
                <span>
                  {b.email ?? "(account)"}
                  <span className="block text-xs text-muted-foreground">{b.reason}</span>
                </span>
                <span className="text-xs whitespace-nowrap text-muted-foreground">
                  lifted {b.lifted_at ? fmtShortDate(b.lifted_at) : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
