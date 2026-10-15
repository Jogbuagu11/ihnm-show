import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function ShowFeedback({
  reservationId,
  tapingId,
  userId,
}: {
  reservationId: string;
  tapingId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const { data: existing, isLoading } = useQuery({
    queryKey: ["fb", reservationId],
    queryFn: async () =>
      (
        await supabase
          .from("taping_feedback")
          .select("*")
          .eq("reservation_id", reservationId)
          .maybeSingle()
      ).data,
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [quote, setQuote] = useState(false);
  if (isLoading) return null;
  if (existing)
    return (
      <div className="border-t p-6 text-sm">
        <span className="text-gold">{"★".repeat(existing.rating)}</span> Thanks for rating tonight's
        taping!
      </div>
    );

  async function send() {
    if (!rating) return toast.error("Tap a star rating first");
    const { error } = await supabase.from("taping_feedback").insert({
      reservation_id: reservationId,
      taping_id: tapingId,
      user_id: userId,
      rating,
      comment: comment || null,
      testimonial_ok: quote,
    });
    if (error) return toast.error(error.message);
    toast.success("Thank you for the feedback!");
    qc.invalidateQueries({ queryKey: ["fb", reservationId] });
  }
  return (
    <div className="space-y-3 border-t bg-secondary/60 p-6">
      <p className="font-semibold">How was the taping?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={`text-3xl ${n <= rating ? "text-gold" : "text-muted-foreground/40"}`}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea
        rows={3}
        maxLength={2000}
        placeholder="Anything you loved, or we could do better? (optional)"
        aria-label="Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="bg-background"
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={quote} onCheckedChange={(v) => setQuote(v === true)} /> You may quote me
        as a testimonial
      </label>
      <Button variant="gold" size="sm" onClick={send}>
        Send feedback
      </Button>
    </div>
  );
}
