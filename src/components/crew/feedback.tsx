import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pill } from "@/components/finance/crud";

export function FeedbackList({ taping }: { taping: { id: string } }) {
  const { data = [] } = useQuery({
    queryKey: ["feedback", taping.id],
    queryFn: async () =>
      (
        await supabase
          .from("taping_feedback")
          .select("*, reservation:reservations(full_name)")
          .eq("taping_id", taping.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const avg = data.length ? data.reduce((s, f) => s + f.rating, 0) / data.length : 0;
  return (
    <div className="mt-4 space-y-4">
      <p className="font-display text-3xl">
        {data.length ? (
          <>
            {avg.toFixed(1)} <span className="italic-gold">/ 5</span>
          </>
        ) : (
          "No ratings yet"
        )}{" "}
        <span className="text-sm text-muted-foreground font-sans">
          {data.length} response{data.length === 1 ? "" : "s"}
        </span>
      </p>
      <ul className="divide-y rounded-2xl border bg-card">
        {data.map((f) => (
          <li key={f.id} className="p-4 text-sm">
            <span className="text-gold" aria-label={`${f.rating} stars`}>
              {"★".repeat(f.rating)}
              {"☆".repeat(5 - f.rating)}
            </span>{" "}
            <span className="font-semibold">{f.reservation?.full_name}</span>
            {f.testimonial_ok && (
              <>
                {" "}
                <Pill tone="warn">OK to quote</Pill>
              </>
            )}
            {f.comment && <p className="mt-1 text-muted-foreground">{f.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
