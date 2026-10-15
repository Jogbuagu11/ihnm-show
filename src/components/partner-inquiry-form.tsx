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
import { PARTNER_INTERESTS } from "@/lib/waitlist";
import { notifyInquiry } from "@/lib/inquiries.functions";

export function PartnerInquiryForm() {
  const [f, setF] = useState({ name: "", business: "", email: "", phone: "", message: "" });
  const [interest, setInterest] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Please add your name.");
    if (!f.email.includes("@")) return toast.error("Please enter a valid email address.");
    if (!interest) return toast.error("Please choose what you're interested in.");

    setBusy(true);
    // The id is generated here rather than read back: anon has no SELECT
    // policy on this table, so an insert...returning would come back empty.
    const id = crypto.randomUUID();
    const { error } = await supabase.from("partner_inquiries").insert({
      id,
      name: f.name.trim(),
      business: f.business.trim() || null,
      email: f.email.trim().toLowerCase(),
      phone: f.phone.trim() || null,
      interest,
      message: f.message.trim() || null,
    });
    setBusy(false);
    if (error) {
      console.error("[partner] inquiry failed", error);
      return toast.error("Could not send your inquiry. Please try again.");
    }
    setSent(true);
    // Alert the team. A failure here must not look like a failed submission —
    // the inquiry is already saved and visible in the Crew Portal.
    notifyInquiry({ data: { table: "partner_inquiries", id } }).catch((e: unknown) =>
      console.error("[partner] notification failed", e),
    );
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-gold/50 bg-white p-6" aria-live="polite">
        <h3 className="font-display text-2xl">
          Inquiry <span className="italic-gold">received</span>.
        </h3>
        <p className="mt-2 text-muted-foreground">
          We'll follow up by email with packages and dates.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-3xl border bg-white p-6 sm:grid-cols-2"
      noValidate
    >
      <div>
        <Label htmlFor="pi-name">Name</Label>
        <Input
          id="pi-name"
          className="mt-1"
          required
          maxLength={120}
          value={f.name}
          onChange={set("name")}
        />
      </div>
      <div>
        <Label htmlFor="pi-business">Business</Label>
        <Input
          id="pi-business"
          className="mt-1"
          maxLength={160}
          value={f.business}
          onChange={set("business")}
        />
      </div>
      <div>
        <Label htmlFor="pi-email">Email</Label>
        <Input
          id="pi-email"
          className="mt-1"
          type="email"
          required
          maxLength={255}
          value={f.email}
          onChange={set("email")}
        />
      </div>
      <div>
        <Label htmlFor="pi-phone">Phone</Label>
        <Input
          id="pi-phone"
          className="mt-1"
          type="tel"
          maxLength={40}
          value={f.phone}
          onChange={set("phone")}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="pi-interest">Interest</Label>
        <Select value={interest} onValueChange={setInterest}>
          <SelectTrigger id="pi-interest" className="mt-1">
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            {PARTNER_INTERESTS.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="pi-message">
          Anything else? <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="pi-message"
          className="mt-1"
          rows={3}
          maxLength={2000}
          value={f.message}
          onChange={set("message")}
        />
      </div>
      <Button type="submit" variant="gold" className="sm:col-span-2" disabled={busy}>
        {busy ? "Sending…" : "Send inquiry"}
      </Button>
    </form>
  );
}
