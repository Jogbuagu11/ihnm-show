type S = { sponsor_name: string | null; sponsor_logo_url: string | null; sponsor_url: string | null };

export function SponsorSlot({ s, label = "This episode supported by", compact = false }: { s: S; label?: string; compact?: boolean }) {
  if (!s.sponsor_name && !s.sponsor_logo_url) return null;
  const inner = (
    <>
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {s.sponsor_logo_url ? (
        <img src={s.sponsor_logo_url} alt={`${s.sponsor_name ?? "Sponsor"} logo`} className={compact ? "h-6 w-auto max-w-28 object-contain" : "h-10 w-auto max-w-40 object-contain"} loading="lazy" />
      ) : (
        <span className="font-display text-lg italic text-foreground">{s.sponsor_name}</span>
      )}
    </>
  );
  const cls = `flex items-center gap-3 ${compact ? "" : "rounded-2xl border border-gold/40 bg-secondary p-4"}`;
  return s.sponsor_url ? (
    <a href={s.sponsor_url} target="_blank" rel="noopener noreferrer sponsored" className={cls}>{inner}</a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
