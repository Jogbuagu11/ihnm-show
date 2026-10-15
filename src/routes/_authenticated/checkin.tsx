import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/checkin")({
  validateSearch: (s: Record<string, unknown>) => ({
    t: String(s["t"] ?? ""),
    c: String(s["c"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "Self Check-in — IHNM Show" },
      { name: "description", content: "Check yourself in at the IHNM Show door." },
      { property: "og:title", content: "Self Check-in — IHNM Show" },
      { property: "og:description", content: "Scan the door sign to check in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckinPage,
});

function CheckinPage() {
  const { t, c } = Route.useSearch();
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    supabase.rpc("self_check_in", { _taping: t, _code: c }).then(({ data, error }) => {
      if (error) return setState({ ok: false, msg: error.message });
      const d = data as { name: string; seats: number; theme: string; already: boolean };
      setState({
        ok: true,
        msg: `${d.already ? "Already checked in" : "Welcome"}, ${d.name} — ${d.seats} seat${d.seats > 1 ? "s" : ""} for “${d.theme}”.`,
      });
    });
  }, [t, c]);
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="eyebrow">Door check-in</p>
      <h1 className="mt-2 font-display text-4xl">
        {!state ? (
          "Checking you in…"
        ) : state.ok ? (
          <>
            You're <span className="italic-gold">in</span>
          </>
        ) : (
          "Hmm…"
        )}
      </h1>
      {state && <p className="mt-4 text-muted-foreground">{state.msg}</p>}
      {state && !state.ok && <p className="mt-2 text-sm">An usher at the door can help.</p>}
      <Button asChild className="mt-8" variant="outline">
        <Link to="/account">My tickets</Link>
      </Button>
    </div>
  );
}
