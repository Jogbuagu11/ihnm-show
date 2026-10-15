import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { youtubeEmbed } from "@/lib/show";
import { OnAir } from "@/components/ticker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Watch Live — IHNM Show Specials" },
      {
        name: "description",
        content:
          "Watch IHNM Show specials live, join the chat, and send in your question for the host.",
      },
      { property: "og:title", content: "Watch IHNM Show Live" },
      {
        property: "og:description",
        content: "Live specials with countdown, chat and audience questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Live,
});

function useNow() {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setN(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  return n;
}

function Countdown({ at }: { at: string }) {
  const now = useNow();
  const ms = Math.max(0, new Date(at).getTime() - now);
  const parts = [
    ["Days", Math.floor(ms / 864e5)],
    ["Hours", Math.floor(ms / 36e5) % 24],
    ["Min", Math.floor(ms / 6e4) % 60],
    ["Sec", Math.floor(ms / 1e3) % 60],
  ] as const;
  return (
    <div className="flex gap-4" role="timer" aria-live="off">
      {parts.map(([l, v]) => (
        <div key={l} className="text-center">
          <p className="font-display text-5xl tabular-nums text-gold md:text-7xl">
            {String(v).padStart(2, "0")}
          </p>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em]">{l}</p>
        </div>
      ))}
    </div>
  );
}

function Live() {
  const now = useNow();
  const { data: ep, isLoading } = useQuery({
    queryKey: ["live-special"],
    queryFn: async () => {
      const since = new Date(Date.now() - 4 * 36e5).toISOString();
      const { data } = await supabase
        .from("episodes")
        .select("*")
        .eq("kind", "special")
        .not("live_at", "is", null)
        .gte("live_at", since)
        .order("live_at")
        .limit(1);
      return data?.[0] ?? null;
    },
  });
  const [f, setF] = useState({ name: "", email: "", content: "" });
  const [sent, setSent] = useState(false);
  async function ask() {
    if (!f.name.trim() || !f.email.includes("@") || !f.content.trim())
      return toast.error("Please add your name, email and question");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("submissions").insert({
      kind: "question",
      name: f.name.trim(),
      email: f.email.trim(),
      content: `[Live: ${ep?.title ?? "special"}] ${f.content.trim()}`.slice(0, 4000),
      user_id: u.user?.id ?? null,
    });
    if (error) return toast.error("Could not send your question");
    setSent(true);
  }
  const started = ep?.live_at && new Date(ep.live_at).getTime() <= now;
  return (
    <section className="bg-stage text-stage-foreground">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-center gap-3">
          <OnAir />
          <p className="eyebrow text-gold">Watch live</p>
        </div>
        {isLoading ? null : !ep ? (
          <>
            <h1 className="display-lg mt-4">
              No special is <span className="italic-gold">scheduled</span>
            </h1>
            <p className="mt-3 text-stage-foreground/80">
              Check back soon — our next live special will appear here with a countdown.
            </p>
          </>
        ) : (
          <>
            <h1 className="display-lg mt-4">{ep.title}</h1>
            {ep.description && (
              <p className="mt-3 max-w-2xl text-stage-foreground/80">{ep.description}</p>
            )}
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div>
                {started && youtubeEmbed(ep.youtube_url) ? (
                  <div className="aspect-video overflow-hidden rounded-3xl border border-gold/40">
                    <iframe
                      src={`${youtubeEmbed(ep.youtube_url)}?autoplay=1`}
                      title={ep.title}
                      className="h-full w-full"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="grid aspect-video place-items-center rounded-3xl border border-gold/40 bg-stage-foreground/5">
                    <div className="text-center">
                      <p className="eyebrow mb-4 text-gold">Going live in</p>
                      {ep.live_at && <Countdown at={ep.live_at} />}
                    </div>
                  </div>
                )}
                {ep.chat_url && (
                  <Button asChild variant="hero" className="mt-4">
                    <a href={ep.chat_url} target="_blank" rel="noreferrer">
                      <MessageCircle className="size-4" aria-hidden /> Open live chat
                    </a>
                  </Button>
                )}
              </div>
              <div className="rounded-3xl bg-ivory p-6 text-foreground">
                <p className="eyebrow">— Ask the host</p>
                {sent ? (
                  <p className="mt-3 font-display text-2xl">
                    Question <span className="italic-gold">received</span> — keep watching!
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        className="mt-1"
                        value={f.name}
                        onChange={(e) => setF({ ...f, name: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        className="mt-1"
                        type="email"
                        value={f.email}
                        onChange={(e) => setF({ ...f, email: e.target.value })}
                        maxLength={255}
                      />
                    </div>
                    <div>
                      <Label>Your question</Label>
                      <Textarea
                        className="mt-1"
                        rows={4}
                        value={f.content}
                        onChange={(e) => setF({ ...f, content: e.target.value })}
                        maxLength={2000}
                      />
                    </div>
                    <Button variant="gold" onClick={ask}>
                      Submit question
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
