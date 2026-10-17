import { PageGate } from "@/components/page-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import audience from "@/assets/audience.jpg";
import { PageHeader } from "@/components/page-header";
import { TapingCard } from "@/components/taping-card";
import { upcomingTapingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "Tickets & Reservations — IHNM Show" },
      {
        name: "description",
        content:
          "Reserve free seats in the IHNM Show live studio audience at Studio A, San Jose. VIP and church group options.",
      },
      { property: "og:title", content: "Get IHNM Show Tickets" },
      {
        property: "og:description",
        content: "Free general admission, VIP front row and church group blocks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GatedTickets,
});

function GatedTickets() {
  return (
    <PageGate page="show_tickets" title="Tickets">
      <Tickets />
    </PageGate>
  );
}

function Tickets() {
  const { data, isLoading } = useQuery(upcomingTapingsQuery);
  return (
    <>
      <PageHeader image={audience} eyebrow="Join the live audience" title="Tickets & Reservations">
        Seats are limited for every taping. When a taping is full, join the waitlist — we'll offer
        you the next open seat.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { t: "General Admission", p: "Free", d: "Reserve your seat in the studio audience." },
            { t: "VIP Front Row", p: "$20", d: "Front-row seating. Online payment coming soon." },
            {
              t: "Church Group",
              p: "5–10 seats",
              d: "Request a block for your church — approved by our team.",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl bg-secondary p-5">
              <p className="font-display text-xl font-semibold">{x.t}</p>
              <p className="mt-1 text-2xl font-semibold text-gold">{x.p}</p>
              <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
        <h2 className="text-3xl font-semibold">Upcoming tapings</h2>
        {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {data?.map((t) => (
            <TapingCard key={t.id} t={t} />
          ))}
        </div>
        {data?.length === 0 && (
          <p className="mt-6 text-muted-foreground">
            No upcoming tapings yet — sign up below for ticket drops.
          </p>
        )}
      </div>
    </>
  );
}
