const items = ["Scripture", "History", "Today's Headlines", "Live Audience", "Worship", "Expert Guests", "Studio A · San Jose"];

export function Ticker() {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-gold/40 bg-stage py-4 text-stage-foreground">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-3xl italic md:text-4xl">
            {t}
            <span className="text-base not-italic text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function OnAir({ label = "Live taping" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-onair/60 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-onair">
      <span className="size-1.5 animate-onair rounded-full bg-onair" />
      {label}
    </span>
  );
}
