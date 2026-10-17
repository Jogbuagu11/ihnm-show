import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Baby, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Room = {
  id: string;
  name: string;
  min_age_years: number;
  max_age_years: number;
  capacity: number;
  places_left: number;
};

const ERRORS: Record<string, string> = {
  room_full: "That room is full for this taping.",
  no_room_for_age: "We can only take children aged 0 to 10.",
  age_required: "Please enter your child's age.",
  name_required: "Please enter your child's first name.",
  guardian_phone_required: "Please add a phone number we can reach you on.",
  reservation_not_confirmed: "Your seat needs to be confirmed first.",
  not_your_reservation: "That booking isn't yours.",
};
const friendly = (m: string) =>
  Object.entries(ERRORS).find(([k]) => m.includes(k))?.[1] ??
  "We couldn't add your child. Please try again.";

/** Childcare sign-up for one reservation. The room follows from the child's
 *  age — the parent never picks one, so a full younger room cannot be dodged
 *  by booking into the older one. */
export function KidsRoom({ tapingId, reservationId }: { tapingId: string; reservationId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    first: "",
    last: "",
    age: "",
    guardian: "",
    phone: "",
    allergies: "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const roomsQ = useQuery({
    queryKey: ["kids-rooms", tapingId],
    queryFn: async (): Promise<Room[]> => {
      const { data, error } = await supabase.rpc("kids_rooms_for_taping", { _taping: tapingId });
      if (error) throw error;
      return (data ?? []) as Room[];
    },
  });

  const mineQ = useQuery({
    queryKey: ["kids-mine", reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_registrations")
        .select(
          "id, child_first_name, age_years, release_code, cancelled_at, room:kids_rooms(name)",
        )
        .eq("reservation_id", reservationId)
        .is("cancelled_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("register_child", {
        _taping: tapingId,
        _reservation: reservationId,
        _first_name: f.first,
        _age: Number(f.age),
        _guardian_name: f.guardian,
        _guardian_phone: f.phone,
        // _last_name has no SQL default so it is always passed; the function
        // turns an empty string into null. _allergies is optional, and
        // exactOptionalPropertyTypes rejects an explicit undefined for one.
        _last_name: f.last.trim(),
        ...(f.allergies.trim() ? { _allergies: f.allergies.trim() } : {}),
      });
      if (error) throw new Error(friendly(error.message));
      return data as unknown as { room_name: string; release_code: string };
    },
    onSuccess: (r) => {
      toast.success(`${f.first} is booked into ${r.room_name}. Pick-up code ${r.release_code}.`);
      setF({ first: "", last: "", age: "", guardian: f.guardian, phone: f.phone, allergies: "" });
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["kids-rooms", tapingId] });
      void qc.invalidateQueries({ queryKey: ["kids-mine", reservationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("cancel_child", { _registration: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed.");
      void qc.invalidateQueries({ queryKey: ["kids-rooms", tapingId] });
      void qc.invalidateQueries({ queryKey: ["kids-mine", reservationId] });
    },
    onError: () => toast.error("Could not remove that booking."),
  });

  const rooms = roomsQ.data ?? [];
  const mine = mineQ.data ?? [];
  const anyPlaces = rooms.some((r) => r.places_left > 0);

  return (
    <div className="mt-4 rounded-2xl border bg-secondary/50 p-4">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Baby className="size-4 text-gold" aria-hidden /> Kids' Room
      </p>

      {mine.length > 0 && (
        <ul className="mt-3 space-y-2">
          {mine.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"
            >
              <span>
                <strong>{k.child_first_name}</strong> ({k.age_years}) ·{" "}
                {(k.room as { name: string } | null)?.name}
                <span className="block text-xs text-muted-foreground">
                  Pick-up code <strong className="text-walnut">{k.release_code}</strong> — bring
                  this with you.
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${k.child_first_name}`}
                onClick={() => remove.mutate(k.id)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {rooms.map((r) => (
          <li key={r.id}>
            {r.name} —{" "}
            <strong className={r.places_left === 0 ? "text-destructive" : "text-walnut"}>
              {r.places_left === 0 ? "full" : `${r.places_left} left`}
            </strong>
          </li>
        ))}
      </ul>

      {!open ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={!anyPlaces}
          onClick={() => setOpen(true)}
        >
          {anyPlaces ? "Add a child" : "Both rooms are full"}
        </Button>
      ) : (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <div>
            <Label htmlFor="kr-first">Child's first name</Label>
            <Input
              id="kr-first"
              required
              maxLength={60}
              className="mt-1"
              value={f.first}
              onChange={set("first")}
            />
          </div>
          <div>
            <Label htmlFor="kr-age">Age</Label>
            <Input
              id="kr-age"
              required
              inputMode="numeric"
              className="mt-1"
              value={f.age}
              onChange={set("age")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              0–4 and 5–10 are separate rooms; we'll place them by age.
            </p>
          </div>
          <div>
            <Label htmlFor="kr-guardian">Your name</Label>
            <Input
              id="kr-guardian"
              required
              maxLength={80}
              className="mt-1"
              value={f.guardian}
              onChange={set("guardian")}
            />
          </div>
          <div>
            <Label htmlFor="kr-phone">Phone during the taping</Label>
            <Input
              id="kr-phone"
              required
              type="tel"
              maxLength={40}
              className="mt-1"
              value={f.phone}
              onChange={set("phone")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="kr-allergies">
              Allergies or anything we should know{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="kr-allergies"
              maxLength={300}
              className="mt-1"
              value={f.allergies}
              onChange={set("allergies")}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button variant="gold" size="sm" disabled={add.isPending}>
              {add.isPending ? "Adding…" : "Add child"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
