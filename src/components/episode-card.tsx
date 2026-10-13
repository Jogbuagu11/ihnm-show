import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { Episode } from "@/lib/queries";
import { fmtShortDate, kindLabel, thumb } from "@/lib/show";

export function EpisodeCard({ ep }: { ep: Episode }) {
  return (
    <Link to="/watch/$slug" params={{ slug: ep.slug }} className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5">
      <div className="relative aspect-video overflow-hidden">
        <img src={thumb(ep.thumbnail)} alt="" loading="lazy" width={1280} height={720} className="size-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-walnut">{kindLabel[ep.kind]}</span>
        <span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-gold-gradient text-gold-foreground opacity-90"><Play className="size-4" /></span>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">{fmtShortDate(ep.aired_on + "T12:00:00Z")}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug">{ep.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{ep.guests.join(" · ")}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ep.tags.map((t) => (
            <span key={t} className="rounded-full bg-blush px-2.5 py-0.5 text-xs text-blush-foreground">{t}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
