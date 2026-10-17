import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMPRINT } from "@/lib/publishing";
import { notifyInquiry } from "@/lib/inquiries.functions";

export const pubContactHead = () => ({
  meta: [
    { title: `Contact — ${IMPRINT}` },
    { name: "description", content: `Get in touch with ${IMPRINT}.` },
    { property: "og:type", content: "website" },
  ],
});

export const Route = createFileRoute("/publishing/contact")({
  head: pubContactHead,
  component: PubContact,
});

// Routed by topic so the right person picks it up. Submissions deliberately
// point at the form rather than accepting a manuscript by email.
const TOPICS = [
  { v: "publishing-rights", l: "Rights and permissions" },
  { v: "publishing-media", l: "Media and reviews" },
  { v: "publishing-trade", l: "Bookstores and bulk orders" },
  { v: "publishing-general", l: "General" },
];

export function PubContact() {
  const [f, setF] = useState({ name: "", email: "", organization: "", message: "" });
  const [topic, setTopic] = useState(TOPICS[3]!.v);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.email.includes("@") || !f.message.trim())
      return toast.error("Please add your name, email and a message.");
    setBusy(true);
    const id = crypto.randomUUID();
    const { error } = await supabase.from("contact_messages").insert({
      id,
      topic,
      name: f.name.trim(),
      email: f.email.trim().toLowerCase(),
      organization: f.organization.trim() || null,
      message: f.message.trim(),
    });
    setBusy(false);
    if (error) {
      console.error("[publishing] contact failed", error);
      return toast.error("Could not send your message.");
    }
    setSent(true);
    notifyInquiry({ data: { table: "contact_messages", id } }).catch((err: unknown) =>
      console.error("[publishing] notification failed", err),
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <p className="eyebrow">— Get in touch</p>
      <h1 className="display-lg mt-4">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        Sending a manuscript? Please use the{" "}
        <a href="/publishing/submit" className="underline hover:text-persimmon">
          submissions form
        </a>{" "}
        instead — it makes sure nothing is missed.
      </p>

      {sent ? (
        <div className="mt-8 rounded-3xl border border-gold/50 bg-white p-6" aria-live="polite">
          <h2 className="font-display text-2xl">
            Message <span className="italic-gold">received</span>.
          </h2>
          <p className="mt-2 text-muted-foreground">We'll reply by email.</p>
        </div>
      ) : (
        <form
          onSubmit={send}
          className="mt-8 grid gap-4 rounded-3xl border bg-white p-6 sm:grid-cols-2"
          noValidate
        >
          <div className="sm:col-span-2">
            <Label htmlFor="pc-topic">What's it about?</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger id="pc-topic" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t.v} value={t.v}>
                    {t.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pc-name">Name</Label>
            <Input
              id="pc-name"
              required
              maxLength={120}
              className="mt-1"
              value={f.name}
              onChange={set("name")}
            />
          </div>
          <div>
            <Label htmlFor="pc-email">Email</Label>
            <Input
              id="pc-email"
              type="email"
              required
              maxLength={255}
              className="mt-1"
              value={f.email}
              onChange={set("email")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pc-org">
              Organisation <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="pc-org"
              maxLength={160}
              className="mt-1"
              value={f.organization}
              onChange={set("organization")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pc-msg">Message</Label>
            <Textarea
              id="pc-msg"
              required
              rows={5}
              maxLength={4000}
              className="mt-1"
              value={f.message}
              onChange={set("message")}
            />
          </div>
          <Button variant="gold" className="sm:col-span-2" disabled={busy}>
            {busy ? "Sending…" : "Send message"}
          </Button>
        </form>
      )}
    </section>
  );
}
