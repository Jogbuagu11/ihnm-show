import { useEffect, useState } from "react";
import { countdownTo } from "@/lib/waitlist";

/** Ticking countdown to the ticket drop. Renders nothing when no date is set,
 *  which is how the hero hides it before a date exists. */
export function Countdown({ target }: { target: string | null | undefined }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const c = countdownTo(target, now);
  if (!c) return null;

  if (c.done) {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">Tickets are open</p>
    );
  }

  const parts = [
    { v: c.days, l: c.days === 1 ? "day" : "days" },
    { v: c.hours, l: "hrs" },
    { v: c.minutes, l: "min" },
    { v: c.seconds, l: "sec" },
  ];

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-stage-foreground/70">
        Tickets drop in
      </p>
      <ul className="mt-2 flex gap-4" aria-label="Time until tickets open">
        {parts.map(({ v, l }) => (
          <li key={l} className="text-center">
            <span className="block font-display text-4xl text-gold tabular-nums">
              {String(v).padStart(2, "0")}
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-stage-foreground/70">
              {l}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
