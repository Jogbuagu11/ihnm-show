import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { getConsent, resubscribe, unsubscribe, type ConsentRow } from "@/lib/consent.functions";

const search = z.object({
  t: z.string().min(8).optional(),
  b: z.enum(["show", "publishing"]).optional(),
});

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Email preferences — IHNM Show" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Unsubscribe,
});

const LABEL = {
  show: "IHNM Show",
  publishing: "IHNM Publishing House",
} as const;

function Unsubscribe() {
  const { t, b } = Route.useSearch() as { t?: string; b?: "show" | "publishing" };
  const [rows, setRows] = useState<ConsentRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The link in the footer names a brand, so one click does the obvious
  // thing. The page then shows both lists so the rest can be corrected.
  const [autoDone, setAutoDone] = useState(false);

  useEffect(() => {
    if (!t) return;
    let active = true;
    (async () => {
      try {
        if (b && !autoDone) {
          await unsubscribe({ data: { token: t, brand: b } });
          if (active) setAutoDone(true);
        }
        const r = await getConsent({ data: { token: t } });
        if (active) setRows(r);
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : "That link didn't work.");
      }
    })();
    return () => {
      active = false;
    };
  }, [t, b, autoDone]);

  async function toggle(row: ConsentRow) {
    if (!t) return;
    setBusy(row.brand);
    setError(null);
    try {
      const fn = row.subscribed ? unsubscribe : resubscribe;
      await fn({ data: { token: t, brand: row.brand } });
      setRows(await getConsent({ data: { token: t } }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  }

  if (!t) {
    return (
      <Shell>
        <p className="text-ink/70">
          This page needs the link from one of our emails. If you cannot find it, write to{" "}
          <a className="underline" href="mailto:hello@ihnmshow.com">
            hello@ihnmshow.com
          </a>{" "}
          and we will take you off by hand.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      {error && <p className="mb-4 text-persimmon">{error}</p>}
      {rows === null && !error && <p className="text-ink/60">One moment…</p>}
      {rows?.length === 0 && (
        <p className="text-ink/70">
          That link is no longer valid. Nothing was changed. Write to{" "}
          <a className="underline" href="mailto:hello@ihnmshow.com">
            hello@ihnmshow.com
          </a>{" "}
          if you still want off the list.
        </p>
      )}
      {rows && rows.length > 0 && (
        <>
          {autoDone && b && (
            <p className="mb-6 rounded-xl bg-white p-4 text-ink">
              Done — you are off the {b ? LABEL[b] : ""} list. Nothing else will come from it.
            </p>
          )}
          <p className="mb-4 text-sm text-ink/60">{rows[0]?.email}</p>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.brand}
                className="flex items-center justify-between gap-4 rounded-xl bg-white p-4"
              >
                <div>
                  <p className="font-medium">{LABEL[row.brand]}</p>
                  <p className="text-sm text-ink/60">
                    {row.subscribed ? "Subscribed" : "Not subscribed"}
                  </p>
                </div>
                <Button
                  variant={row.subscribed ? "outline" : "gold"}
                  size="sm"
                  disabled={busy === row.brand}
                  onClick={() => void toggle(row)}
                >
                  <span>
                    {busy === row.brand
                      ? "Saving…"
                      : row.subscribed
                        ? "Unsubscribe"
                        : "Subscribe again"}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink/60">
            The two lists are separate. Tickets, receipts and anything you asked us for still reach
            you either way.
          </p>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl">Email preferences</h1>
      <div className="mt-6">{children}</div>
    </main>
  );
}
