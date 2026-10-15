import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmWaitlist } from "@/lib/waitlist.functions";
import { ReferralPanel } from "@/components/referral-panel";

export const Route = createFileRoute("/confirm/$token")({
  head: () => ({
    meta: [{ title: "Confirm your spot — IHNM Show" }, { name: "robots", content: "noindex" }],
  }),
  component: Confirm,
});

type State =
  | { tag: "loading" }
  | { tag: "error"; message: string }
  | { tag: "done"; position: number; code: string; firstName: string; referralCount: number };

function Confirm() {
  const { token } = Route.useParams();
  const [state, setState] = useState<State>({ tag: "loading" });

  useEffect(() => {
    let active = true;
    confirmWaitlist({ data: { token } })
      .then((r) => {
        if (active)
          setState({
            tag: "done",
            position: r.position,
            code: r.referral_code,
            firstName: r.first_name,
            referralCount: r.referral_count,
          });
      })
      .catch((e: unknown) => {
        if (active)
          setState({
            tag: "error",
            message: e instanceof Error ? e.message : "That link didn't work.",
          });
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-20" aria-live="polite">
      {state.tag === "loading" && <p className="text-muted-foreground">Confirming your spot…</p>}

      {state.tag === "error" && (
        <>
          <h1 className="display-lg">That link didn't work.</h1>
          <p className="mt-3 text-muted-foreground">{state.message}</p>
          <Button asChild variant="gold" className="mt-6">
            <a href="/#waitlist">Back to the waitlist</a>
          </Button>
        </>
      )}

      {state.tag === "done" && (
        <>
          <p className="eyebrow">— You're in</p>
          <p className="mt-3 text-muted-foreground">
            Thanks{state.firstName ? ` ${state.firstName}` : ""} — your spot is confirmed.
          </p>
          <div className="mt-6">
            <ReferralPanel
              position={state.position}
              referralCode={state.code}
              referralCount={state.referralCount}
              firstName={state.firstName}
              idPrefix="confirm"
            />
          </div>
        </>
      )}
    </section>
  );
}
