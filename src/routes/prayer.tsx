import { PageGate } from "@/components/page-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import studio from "@/assets/studio.jpg";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/prayer")({
  head: () => ({
    meta: [
      { title: "Prayer & Testimony — IHNM Show" },
      {
        name: "description",
        content: "Send the IHNM Show team a prayer request or share a testimony.",
      },
      { property: "og:title", content: "Prayer & Testimony — IHNM Show" },
      {
        property: "og:description",
        content: "We'd be honored to pray with you or hear what God has done.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GatedPrayer,
});

function GatedPrayer() {
  return (
    <PageGate page="show_prayer" title="Prayer & testimony">
      <Prayer />
    </PageGate>
  );
}

function Prayer() {
  const [kind, setKind] = useState<"prayer" | "testimony">("prayer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [onAir, setOnAir] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("prayer_requests")
      .insert({ kind, name: name || null, email: email || null, body, share_on_air: onAir });
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <>
      <PageHeader image={studio} eyebrow="We're with you" title="Prayer & testimony">
        Share what's on your heart. Our team reads every message and prays over each request.
      </PageHeader>
      <section className="mx-auto max-w-2xl px-4 py-14">
        {sent ? (
          <div className="rounded-3xl border bg-card p-8 text-center">
            <h2 className="font-display text-3xl">
              Thank <span className="italic-gold">you</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              We received your {kind === "prayer" ? "prayer request" : "testimony"}.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={kind === "prayer" ? "gold" : "outline"}
                onClick={() => setKind("prayer")}
              >
                Prayer request
              </Button>
              <Button
                type="button"
                variant={kind === "testimony" ? "gold" : "outline"}
                onClick={() => setKind("testimony")}
              >
                Testimony
              </Button>
            </div>
            <Input
              placeholder="Name (optional)"
              aria-label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email (optional, if you'd like a reply)"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Textarea
              required
              maxLength={4000}
              rows={6}
              aria-label="Message"
              placeholder={kind === "prayer" ? "How can we pray for you?" : "What has God done?"}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={onAir} onCheckedChange={(v) => setOnAir(v === true)} /> The host
              may share this on the show (first name only).
            </label>
            <Button type="submit" variant="gold">
              Send
            </Button>
          </form>
        )}
      </section>
    </>
  );
}
