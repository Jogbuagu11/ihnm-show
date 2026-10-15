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

const TOPICS = {
  tickets: "Tickets",
  rentals: "Studio rentals",
  sponsors: "Sponsorship",
  press: "Press",
  general: "General",
} as const;
type Topic = keyof typeof TOPICS;

export function ContactForm({
  topic: fixed,
  cta = "Send message",
}: {
  topic?: Topic;
  cta?: string;
}) {
  const [topic, setTopic] = useState<Topic>(fixed ?? "general");
  const [f, setF] = useState({ name: "", email: "", phone: "", organization: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: e.target.value });
  async function send() {
    if (!f.name.trim() || !f.email.includes("@") || !f.message.trim())
      return toast.error("Please add your name, email and a message");
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      topic,
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone || null,
      organization: f.organization || null,
      message: f.message.trim(),
    });
    setBusy(false);
    if (error) return toast.error("Could not send your message");
    setSent(true);
  }
  if (sent)
    return (
      <div className="rounded-3xl border border-gold/50 bg-white p-6">
        <h3 className="font-display text-2xl">
          Message <span className="italic-gold">received</span>.
        </h3>
        <p className="mt-2 text-muted-foreground">Our team will reply by email.</p>
      </div>
    );
  return (
    <div className="grid gap-4 rounded-3xl border bg-white p-6 sm:grid-cols-2">
      {!fixed && (
        <div className="sm:col-span-2">
          <Label>Topic</Label>
          <Select value={topic} onValueChange={(v) => setTopic(v as Topic)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TOPICS).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Name</Label>
        <Input className="mt-1" value={f.name} onChange={set("name")} maxLength={100} />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          className="mt-1"
          type="email"
          value={f.email}
          onChange={set("email")}
          maxLength={255}
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input className="mt-1" value={f.phone} onChange={set("phone")} maxLength={30} />
      </div>
      <div>
        <Label>{fixed === "sponsors" ? "Business" : "Organization"}</Label>
        <Input
          className="mt-1"
          value={f.organization}
          onChange={set("organization")}
          maxLength={150}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Message</Label>
        <Textarea
          className="mt-1"
          rows={4}
          value={f.message}
          onChange={set("message")}
          maxLength={4000}
        />
      </div>
      <Button variant="gold" className="sm:col-span-2" disabled={busy} onClick={send}>
        {busy ? "Sending…" : cta}
      </Button>
    </div>
  );
}
