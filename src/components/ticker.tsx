const items = [
  "Scripture",
  "History",
  "Today's Headlines",
  "Live Audience",
  "Worship",
  "Expert Guests",
  "Studio A · San Jose",
];

export function Ticker() {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-gold/60 bg-stage py-4 text-stage-foreground">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[...row, ...row].map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-display text-3xl italic md:text-4xl"
          >
            {t}
            <span className="text-base not-italic text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Compact moving strip for the top of the landing page. Doubling the row and
 *  translating -50% makes the loop seamless; prefers-reduced-motion parks it. */
export function TickerStrip() {
  const row = [
    "Scripture",
    "History",
    "Today's Headlines",
    "Live studio audience",
    "Worship",
    "Expert guests",
    "Studio A · San Jose",
    "Launching early 2027",
  ];
  const doubled = [...row, ...row];
  return (
    <div
      className="overflow-hidden bg-persimmon py-2.5 text-persimmon-foreground"
      role="presentation"
    >
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap motion-reduce:animate-none">
        {[...doubled, ...doubled].map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-mono text-[0.7rem] uppercase tracking-[0.28em]"
          >
            {t}
            <span aria-hidden className="text-sm opacity-70">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function OnAir({ label = "Live taping" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-onair/70 bg-onair/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-onair">
      <span className="size-1.5 animate-onair rounded-full bg-onair" />
      {label}
    </span>
  );
}
