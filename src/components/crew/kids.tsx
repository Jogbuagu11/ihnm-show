import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/finance/crud";
import type { Database } from "@/integrations/supabase/types";

type Taping = Database["public"]["Tables"]["tapings"]["Row"];

type Registration = {
  id: string;
  child_first_name: string;
  child_last_name: string | null;
  age_years: number;
  allergies: string | null;
  notes: string | null;
  guardian_name: string;
  guardian_phone: string;
  release_code: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  released_to: string | null;
  room: { id: string; name: string; capacity: number } | null;
};

/** The register for the Kids' Rooms on one taping: who is expected, who is in,
 *  and the code check that has to pass before a child is handed over. */
export function KidsAdmin({ taping }: { taping: Taping }) {
  const qc = useQueryClient();
  const key = ["crew", "kids", taping.id];

  const { data: rows = [] } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Registration[]> => {
      const { data: rooms } = await supabase.rpc("kids_rooms_for_taping", { _taping: taping.id });
      const ids = (rooms ?? []).map((r: { id: string }) => r.id);
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("kids_registrations")
        .select(
          "id, child_first_name, child_last_name, age_years, allergies, notes, guardian_name, guardian_phone, release_code, checked_in_at, checked_out_at, released_to, room:kids_rooms(id, name, capacity)",
        )
        .in("room_id", ids)
        .is("cancelled_at", null)
        .order("child_first_name");
      if (error) throw error;
      return (data ?? []) as unknown as Registration[];
    },
  });

  const checkIn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("kids_check_in", { _registration: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Checked in.");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: () => toast.error("Could not check that child in."),
  });

  const byRoom = rows.reduce<Record<string, Registration[]>>((acc, r) => {
    const name = r.room?.name ?? "Unassigned";
    (acc[name] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="mt-4 space-y-8">
      <p className="text-sm text-muted-foreground">
        Children booked for <strong>{taping.theme}</strong>. A child is only released when the
        grown-up's code matches.
      </p>

      {Object.keys(byRoom).length === 0 && (
        <p className="text-muted-foreground">No children booked for this taping yet.</p>
      )}

      {Object.entries(byRoom).map(([room, list]) => {
        const inRoom = list.filter((r) => r.checked_in_at && !r.checked_out_at).length;
        return (
          <section key={room}>
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">— {room}</p>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {inRoom} in room · {list.length} booked
              </p>
            </div>
            <ul className="mt-3 divide-y rounded-2xl border bg-card">
              {list.map((r) => (
                <ChildRow
                  key={r.id}
                  r={r}
                  onCheckIn={() => checkIn.mutate(r.id)}
                  onDone={() => qc.invalidateQueries({ queryKey: key })}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ChildRow({
  r,
  onCheckIn,
  onDone,
}: {
  r: Registration;
  onCheckIn: () => void;
  onDone: () => void;
}) {
  const [code, setCode] = useState("");
  const [who, setWho] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [busy, setBusy] = useState(false);

  const out = !!r.checked_out_at;
  const inRoom = !!r.checked_in_at && !out;

  async function release(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("kids_check_out", {
      _registration: r.id,
      _code: code,
      _released_to: who || r.guardian_name,
    });
    setBusy(false);
    if (error) {
      // The code is the safeguard, so a mismatch must read as a refusal.
      toast.error(
        error.message.includes("bad_release_code")
          ? "That code doesn't match. Do not release this child."
          : "Could not check that child out.",
      );
      return;
    }
    toast.success(`${r.child_first_name} released.`);
    setReleasing(false);
    setCode("");
    onDone();
  }

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {r.child_first_name} {r.child_last_name ?? ""}{" "}
            <span className="font-normal text-muted-foreground">({r.age_years})</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {r.guardian_name} ·{" "}
            <a href={`tel:${r.guardian_phone}`} className="underline hover:text-gold">
              {r.guardian_phone}
            </a>
          </p>
          {r.allergies && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="size-3.5" aria-hidden /> {r.allergies}
            </p>
          )}
          {r.notes && <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>}
        </div>

        <div className="flex items-center gap-2">
          {out ? (
            <Pill tone="muted">Collected by {r.released_to}</Pill>
          ) : inRoom ? (
            <>
              <Pill tone="good">In room</Pill>
              <Button size="sm" variant="outline" onClick={() => setReleasing((v) => !v)}>
                <LogOut className="size-4" aria-hidden /> Release
              </Button>
            </>
          ) : (
            <Button size="sm" variant="gold" onClick={onCheckIn}>
              <Check className="size-4" aria-hidden /> Check in
            </Button>
          )}
        </div>
      </div>

      {releasing && !out && (
        <form
          onSubmit={release}
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-secondary/60 p-3"
        >
          <div>
            <Label htmlFor={`code-${r.id}`}>Code on their slip</Label>
            <Input
              id={`code-${r.id}`}
              required
              autoComplete="off"
              maxLength={6}
              className="mt-1 w-28 font-mono uppercase tracking-[0.2em]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`who-${r.id}`}>Collected by</Label>
            <Input
              id={`who-${r.id}`}
              className="mt-1 w-48"
              placeholder={r.guardian_name}
              value={who}
              onChange={(e) => setWho(e.target.value)}
            />
          </div>
          <Button size="sm" variant="gold" disabled={busy}>
            {busy ? "Checking…" : "Release child"}
          </Button>
        </form>
      )}
    </li>
  );
}
