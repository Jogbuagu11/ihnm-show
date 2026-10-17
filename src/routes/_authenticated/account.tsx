import { TapingUpdates } from "@/components/taping-updates";
import { KidsRoom } from "@/components/kids-room";
import { ShowFeedback } from "@/components/show-feedback";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { Bus, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fmtClock, fmtDate, fmtTime, LOCATION, shuttleLoops } from "@/lib/show";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Tickets — IHNM Show" },
      { name: "description", content: "Your IHNM Show tickets, QR codes and shuttle bookings." },
      { property: "og:title", content: "My Tickets — IHNM Show" },
      { property: "og:description", content: "Your tickets and shuttle bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function useMine(userId?: string) {
  return useQuery({
    queryKey: ["mine", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [r, w, g, s] = await Promise.all([
        supabase
          .from("reservations")
          .select("*, taping:tapings(*)")
          .eq("user_id", userId!)
          .neq("status", "cancelled")
          .order("created_at"),
        supabase
          .from("waitlist")
          .select("*, taping:tapings(theme, starts_at)")
          .eq("user_id", userId!)
          .in("status", ["waiting", "offered"]),
        supabase
          .from("group_requests")
          .select("*, taping:tapings(theme, starts_at)")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("shuttle_bookings")
          .select("*")
          .eq("user_id", userId!)
          .neq("status", "cancelled"),
      ]);
      return {
        res: r.data ?? [],
        wait: w.data ?? [],
        groups: g.data ?? [],
        shuttles: s.data ?? [],
      };
    },
  });
}

function Account() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, refetch } = useMine(user?.id);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function claim(tapingId: string, name: string) {
    const { data: r, error } = await supabase.rpc("reserve_seat", {
      _taping: tapingId,
      _name: name,
      _email: user?.email ?? "",
      _question: "",
      _consent: true,
    });
    if (error) return toast.error(error.message);
    toast.success(
      (r as { status: string }).status === "confirmed"
        ? "Seat claimed!"
        : "Still full — you're on the waitlist.",
    );
    refetch();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1 text-4xl font-semibold">My Tickets</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={signOut}>
          Sign out
        </Button>
      </div>
      {user?.email && <MyGiving email={user.email} />}

      {data?.wait.map((w) => (
        <div
          key={w.id}
          className={`mt-6 rounded-2xl p-5 ${w.status === "offered" ? "border border-gold bg-secondary" : "bg-muted"}`}
        >
          <p className="font-semibold">
            {w.status === "offered" ? "A seat opened up for you!" : "You're on the waitlist"}
          </p>
          <p className="text-sm text-muted-foreground">
            {w.taping?.theme} · {w.taping && fmtDate(w.taping.starts_at)}
          </p>
          {w.status === "offered" && (
            <Button variant="gold" className="mt-3" onClick={() => claim(w.taping_id, w.full_name)}>
              Claim my seat
            </Button>
          )}
        </div>
      ))}

      <div className="mt-8 space-y-6">
        {data?.res.length === 0 && (
          <p className="text-muted-foreground">
            No tickets yet. Head to Tickets to reserve a seat.
          </p>
        )}
        {data?.res.map((r) => (
          <TicketCard
            key={r.id}
            r={r}
            shuttle={data.shuttles.find((s) => s.reservation_id === r.id)}
            onChange={refetch}
          />
        ))}
      </div>

      {!!data?.groups.length && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold">Group requests</h2>
          <ul className="mt-3 space-y-2">
            {data.groups.map((g) => (
              <li key={g.id} className="flex justify-between rounded-xl bg-secondary p-4 text-sm">
                <span>
                  {g.church_name} · {g.seats} seats · {g.taping?.theme}
                </span>
                <span className="font-semibold capitalize">{g.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type Res = NonNullable<ReturnType<typeof useMine>["data"]>["res"][number];
type Sb = NonNullable<ReturnType<typeof useMine>["data"]>["shuttles"][number];

function TicketCard({
  r,
  shuttle,
  onChange,
}: {
  r: Res;
  shuttle: Sb | undefined;
  onChange: () => void;
}) {
  const t = r.taping!;
  const loops = shuttleLoops(t.shuttle_start, t.shuttle_end, t.shuttle_interval_min);
  const [loop, setLoop] = useState<string>(shuttle?.loop_time ?? loops[0] ?? "18:00");
  const [dir, setDir] = useState(shuttle?.direction ?? "both");
  const tonight = new Date(t.starts_at).toDateString() === new Date().toDateString();

  async function cancel() {
    const { error } = await supabase.rpc("cancel_reservation", { _reservation: r.id });
    if (error) return toast.error(error.message);
    toast.success("Reservation cancelled — your seat goes to the waitlist.");
    onChange();
  }
  async function book() {
    const { error } = await supabase.rpc("book_shuttle", {
      _reservation: r.id,
      _loop: dir === "return" ? "return" : loop,
      _direction: dir,
    });
    if (error) return toast.error(error.message);
    toast.success("Shuttle seat saved");
    onChange();
  }
  async function removeShuttle() {
    if (!shuttle) return;
    await supabase.from("shuttle_bookings").delete().eq("id", shuttle.id);
    onChange();
  }
  async function signal(s: "here" | "late") {
    if (!shuttle) return;
    const { error } = await supabase.rpc("shuttle_signal", { _booking: shuttle.id, _signal: s });
    if (error) return toast.error(error.message);
    toast.success(s === "here" ? "Crew notified you're here" : "Crew notified you're running late");
    onChange();
  }

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-soft">
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">
            {r.ticket_type === "group"
              ? "Church group"
              : r.ticket_type === "vip"
                ? "VIP Front Row"
                : "General Admission"}{" "}
            · {r.seats} seat{r.seats > 1 ? "s" : ""}
          </p>
          <h3 className="mt-1 text-2xl font-semibold">{t.theme}</h3>
          <p className="mt-2 text-sm">
            {fmtDate(t.starts_at)} · {fmtTime(t.starts_at)}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {LOCATION}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Doors open 30 minutes before taping. Parking is limited — we recommend the shuttle.
            Pickup location: TBA.
          </p>
          {r.status === "checked_in" && (
            <p className="mt-2 text-sm font-semibold text-success">Checked in ✓</p>
          )}
        </div>
        <div className="mx-auto rounded-2xl bg-ivory p-3">
          <QRCodeSVG value={r.qr_code} size={140} />
          <p className="mt-1 text-center text-[10px] text-muted-foreground">Show at the door</p>
        </div>
      </div>
      <div className="border-t bg-secondary/60 p-6">
        <p className="flex items-center gap-2 font-semibold">
          <Bus className="size-4 text-gold" /> Shuttle
        </p>
        {shuttle ? (
          <div className="mt-2 space-y-3">
            <p className="text-sm">
              {shuttle.direction === "return"
                ? "Return after the show"
                : `Departs ${fmtClock(shuttle.loop_time)}`}
              {shuttle.direction === "both" && " · return after the show"}
            </p>
            <div className="flex flex-wrap gap-2">
              {tonight && (
                <Button
                  variant="gold"
                  size="sm"
                  className="h-9 px-4"
                  onClick={() => signal("here")}
                >
                  {shuttle.arrived_at ? "Here ✓" : "I'm here"}
                </Button>
              )}
              {tonight && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full px-4"
                  onClick={() => signal("late")}
                >
                  Running late
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-9" onClick={removeShuttle}>
                Remove shuttle
              </Button>
            </div>
            {!tonight && (
              <p className="text-xs text-muted-foreground">
                “I'm here” and “Running late” buttons appear on taping night.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select value={dir} onValueChange={setDir}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">To & return</SelectItem>
                <SelectItem value="to">To studio only</SelectItem>
                <SelectItem value="return">Return only</SelectItem>
              </SelectContent>
            </Select>
            {dir !== "return" && (
              <Select value={loop} onValueChange={setLoop}>
                <SelectTrigger className="w-32 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loops.map((l) => (
                    <SelectItem key={l} value={l}>
                      {fmtClock(l)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="pill" size="sm" className="h-9 px-4" onClick={book}>
              Add shuttle seat
            </Button>
          </div>
        )}
      </div>
      <TapingUpdates
        tapingId={r.taping_id}
        reservationId={r.id}
        optIn={r.sms_opt_in}
        phone={r.sms_phone}
        onChange={onChange}
      />
      {new Date(t.starts_at) < new Date() && (
        <ShowFeedback reservationId={r.id} tapingId={r.taping_id} userId={r.user_id} />
      )}
      <div className="flex justify-end border-t p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              Cancel reservation
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
              <AlertDialogDescription>
                Your seat and any shuttle booking will be released to the waitlist.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={cancel}>Cancel reservation</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <KidsRoom tapingId={t.id} reservationId={r.id} />
    </div>
  );
}

function MyGiving({ email }: { email: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["my-giving", email],
    queryFn: async () =>
      (
        await supabase
          .from("partners")
          .select("id, amount_cents, frequency, status, start_date")
          .ilike("email", email)
          .neq("status", "canceled")
      ).data ?? [],
  });
  if (!data.length) return null;
  async function cancel(id: string) {
    if (!window.confirm("Cancel this gift? You can restart any time.")) return;
    const { error } = await supabase.rpc("cancel_my_giving", { _partner: id });
    if (error) return toast.error(error.message);
    toast.success("Your giving has been canceled. Thank you for your support!");
    qc.invalidateQueries({ queryKey: ["my-giving"] });
  }
  return (
    <section className="mt-8 rounded-3xl border border-gold/50 bg-secondary p-5">
      <p className="eyebrow">My giving</p>
      <ul className="mt-3 space-y-2">
        {data.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-3 text-sm">
            <span>
              ${(g.amount_cents / 100).toFixed(2)}{" "}
              {g.frequency === "monthly" ? "every month" : "one-time"} ·{" "}
              <span className="capitalize">{g.status}</span>
            </span>
            {g.frequency === "monthly" && (
              <Button size="sm" variant="outline" onClick={() => cancel(g.id)}>
                Cancel giving
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
