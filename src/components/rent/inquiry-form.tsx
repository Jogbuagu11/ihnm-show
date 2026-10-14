import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function InquiryForm() {
  const { user } = useAuth();
  const [f, setF] = useState({ name: "", email: user?.email ?? "", phone: "", event_type: "", preferred_date: "", headcount: 20, details: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: k === "headcount" ? Number(e.target.value) : e.target.value });

  async function send() {
    if (!f.name.trim() || !f.email.includes("@") || !f.details.trim() || !f.event_type.trim()) return toast.error("Please fill in name, email, event type and details");
    setBusy(true);
    const { error } = await supabase.from("rental_inquiries").insert({
      name: f.name.trim(), email: f.email.trim(), phone: f.phone || null, event_type: f.event_type.trim(),
      preferred_date: f.preferred_date || null, headcount: f.headcount, details: f.details.trim(), user_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error("Could not send your request");
    setSent(true);
  }

  if (sent) return <div className="rounded-3xl border border-gold/50 bg-card p-6"><h3 className="font-display text-2xl">Thank you — request <span className="italic-gold">received</span>.</h3><p className="mt-2 text-muted-foreground">We'll reply by email with a custom quote and a payment link.</p></div>;
  return (
    <div className="grid gap-4 rounded-3xl border bg-card p-6 sm:grid-cols-2">
      <div><Label>Name</Label><Input className="mt-1" value={f.name} onChange={set("name")} maxLength={100} /></div>
      <div><Label>Email</Label><Input className="mt-1" type="email" value={f.email} onChange={set("email")} maxLength={255} /></div>
      <div><Label>Phone</Label><Input className="mt-1" value={f.phone} onChange={set("phone")} maxLength={30} /></div>
      <div><Label>Type of event</Label><Input className="mt-1" placeholder="Workshop, screening, celebration…" value={f.event_type} onChange={set("event_type")} maxLength={100} /></div>
      <div><Label>Preferred date</Label><Input className="mt-1" type="date" value={f.preferred_date} onChange={set("preferred_date")} /></div>
      <div><Label>Expected guests</Label><Input className="mt-1" type="number" min={1} value={f.headcount} onChange={set("headcount")} /></div>
      <div className="sm:col-span-2"><Label>Tell us about it</Label><Textarea className="mt-1" rows={4} value={f.details} onChange={set("details")} maxLength={3000} /></div>
      <Button variant="gold" className="sm:col-span-2" disabled={busy} onClick={send}>{busy ? "Sending…" : "Request an event quote"}</Button>
    </div>
  );
}
