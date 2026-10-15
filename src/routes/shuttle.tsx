import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bus, MapPin } from "lucide-react";
import shuttleImg from "@/assets/shuttle.jpg";
import studio from "@/assets/studio.jpg";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { upcomingTapingsQuery } from "@/lib/queries";
import { fmtClock, fmtDate, shuttleLoops } from "@/lib/show";

export const Route = createFileRoute("/shuttle")({
  head: () => ({
    meta: [
      { title: "Shuttle — IHNM Show" },
      {
        name: "description",
        content: "Book a free shuttle seat to and from IHNM Show tapings at Studio A, San Jose.",
      },
      { property: "og:title", content: "IHNM Show Shuttle" },
      {
        property: "og:description",
        content: "Shuttle loops to Studio A, San Jose, with returns after the show.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shuttle,
});

function LoopTable({
  tapingId,
  start,
  end,
  interval,
  perLoop,
}: {
  tapingId: string;
  start: string;
  end: string;
  interval: number;
  perLoop: number;
}) {
  const { data } = useQuery({
    queryKey: ["shuttle-avail", tapingId],
    queryFn: async () =>
      (await supabase.rpc("shuttle_availability", { _taping: tapingId })).data ?? [],
  });
  const booked = new Map(
    (data ?? []).map((r: { loop_time: string; booked: number }) => [r.loop_time, r.booked]),
  );
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {shuttleLoops(start, end, interval).map((l) => {
        const left = perLoop - (booked.get(l) ?? 0);
        return (
          <span
            key={l}
            className={`rounded-full px-3 py-1.5 text-sm ${left > 0 ? "bg-secondary" : "bg-muted text-muted-foreground line-through"}`}
          >
            {fmtClock(l)} · {Math.max(left, 0)} left
          </span>
        );
      })}
      <span className="rounded-full bg-blush px-3 py-1.5 text-sm text-blush-foreground">
        Return after the show
      </span>
    </div>
  );
}

function Shuttle() {
  const { data } = useQuery(upcomingTapingsQuery);
  return (
    <>
      <PageHeader image={shuttleImg} eyebrow="Getting here" title="Shuttle">
        Skip the parking hunt. Add a shuttle seat to your reservation — to the studio, back, or
        both.
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6 shadow-soft">
          <p className="eyebrow">Pickup point</p>
          <p className="mt-2 flex items-center gap-2 font-display text-2xl">
            <MapPin className="text-gold" /> Pickup location: TBA
          </p>
          <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-muted">
            <img
              src={studio}
              alt=""
              loading="lazy"
              width={1600}
              height={912}
              className="size-full object-cover opacity-30 blur-sm"
            />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-muted-foreground">
              Map coming soon
            </span>
          </div>
          <img
            src={shuttleImg}
            alt="Shuttle van at the pickup point"
            loading="lazy"
            width={1280}
            height={720}
            className="mt-4 aspect-video w-full rounded-2xl object-cover"
          />
        </div>
        <div>
          <h2 className="text-3xl font-semibold">Loop schedule</h2>
          <p className="mt-2 text-muted-foreground">
            Seats are limited on every loop. Book from My Tickets after you reserve.
          </p>
          <div className="mt-6 space-y-6">
            {data?.map((t) => (
              <div key={t.id} className="rounded-2xl bg-secondary p-5">
                <p className="flex items-center gap-2 font-semibold">
                  <Bus className="size-4 text-gold" /> {t.theme}
                </p>
                <p className="text-sm text-muted-foreground">{fmtDate(t.starts_at)}</p>
                <LoopTable
                  tapingId={t.id}
                  start={t.shuttle_start}
                  end={t.shuttle_end}
                  interval={t.shuttle_interval_min}
                  perLoop={t.shuttle_seats_per_loop}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-gold p-5">
            <p className="font-semibold">On taping night</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open My Tickets and tap “I'm here” at the pickup point, or “Running late” so our crew
              knows.
            </p>
            <Button asChild variant="pill" className="mt-4">
              <Link to="/account">Go to My Tickets</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
