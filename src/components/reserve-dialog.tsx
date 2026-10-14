import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { TapingWithAvail } from "@/lib/queries";
import { fmtDate, fmtTime } from "@/lib/show";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const groupSchema = z.object({
  church_name: z.string().trim().min(1, "Church name is required").max(120),
  contact_name: z.string().trim().min(1, "Contact name is required").max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  seats: z.number().int().min(5, "Groups are 5–10 seats").max(10, "Groups are 5–10 seats"),
  notes: z.string().trim().max(1000).optional(),
});

export function ReserveDialog({ taping, trigger }: { taping: TapingWithAvail; trigger: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"general" | "vip" | "group">("general");
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [consent, setConsent] = useState(false);
  const [hasMinors, setHasMinors] = useState(false);
  const [minors, setMinors] = useState<string[]>([""]);
  const [accessible, setAccessible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [g, setG] = useState({ church_name: "", contact_name: "", phone: "", seats: 6, notes: "" });
  const full = taping.avail.seats_left <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!consent) return toast.error("Please agree to the filming consent");
    setBusy(true);
    try {
      if (type === "group") {
        const parsed = groupSchema.safeParse({ ...g, email: user.email ?? "", phone: g.phone || undefined, notes: g.notes || undefined });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Please check the form");
        const { error } = await supabase.from("group_requests").insert({ ...parsed.data, phone: parsed.data.phone ?? null, notes: parsed.data.notes ?? null, taping_id: taping.id, user_id: user.id });
        if (error) throw error;
        toast.success("Group request sent! We'll confirm once a producer approves it.");
      } else {
        if (!name.trim()) throw new Error("Please enter your name");
        if (hasMinors && !minors.some((m) => m.trim())) throw new Error("Please list the name of each attendee under 18");
        const { data, error } = await supabase.rpc("reserve_seat", {
          _taping: taping.id, _name: name.trim(), _email: user.email ?? "", _question: question.trim(), _consent: consent,
          _minors: hasMinors ? minors.map((m) => m.trim()).filter(Boolean) : [], _accessible: accessible,
        });
        if (error) throw error;
        const res = data as { status: string };
        if (res.status === "waitlisted") toast.success("This taping is full — you're on the waitlist. We'll offer you the next open seat.");
        else toast.success("You're in! Your ticket is in My Tickets.");
      }
      qc.invalidateQueries();
      setOpen(false);
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{taping.theme}</DialogTitle>
          <DialogDescription>{fmtDate(taping.starts_at)} · {fmtTime(taping.starts_at)}</DialogDescription>
        </DialogHeader>
        {!user ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Sign in to reserve seats and keep your ticket in one place.</p>
            <Button asChild variant="pill" className="w-full"><Link to="/auth">Sign in or create account</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <RadioGroup value={type} onValueChange={(v) => setType(v as typeof type)} className="gap-2">
              {[
                { v: "general", t: "General Admission", d: full ? "Full — join the waitlist" : "Free", disabled: false },
                { v: "vip", t: "VIP Front Row", d: "$20 · online payment coming soon", disabled: true },
                { v: "group", t: "Church Group block", d: "5–10 seats · approved by our team", disabled: !taping.group_enabled },
              ].map((o) => (
                <Label key={o.v} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${type === o.v ? "border-gold bg-secondary" : "border-border"} ${o.disabled ? "opacity-50" : ""}`}>
                  <RadioGroupItem value={o.v} disabled={o.disabled} />
                  <span className="flex-1"><span className="block font-semibold">{o.t}</span><span className="text-xs text-muted-foreground">{o.d}</span></span>
                </Label>
              ))}
            </RadioGroup>

            {type === "group" ? (
              <div className="grid gap-3">
                <div><Label>Church name</Label><Input value={g.church_name} onChange={(e) => setG({ ...g, church_name: e.target.value })} maxLength={120} /></div>
                <div><Label>Contact name</Label><Input value={g.contact_name} onChange={(e) => setG({ ...g, contact_name: e.target.value })} maxLength={100} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={g.phone} onChange={(e) => setG({ ...g, phone: e.target.value })} maxLength={30} /></div>
                  <div><Label>Seats (5–10)</Label><Input type="number" min={5} max={10} value={g.seats} onChange={(e) => setG({ ...g, seats: Number(e.target.value) })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={g.notes} onChange={(e) => setG({ ...g, notes: e.target.value })} maxLength={1000} /></div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /></div>
                <div>
                  <Label>Submit a question or story for this episode <span className="text-muted-foreground">(optional)</span></Label>
                  <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={2000} />
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-sm font-semibold">Are any attendees under 18?</p>
                  <RadioGroup value={hasMinors ? "yes" : "no"} onValueChange={(v) => setHasMinors(v === "yes")} className="mt-2 flex gap-4">
                    <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="no" /> No</Label>
                    <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="yes" /> Yes</Label>
                  </RadioGroup>
                  {hasMinors && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Minors must be listed on your adult ticket and stay with you. Each adds a seat (up to 4).</p>
                      {minors.map((m, i) => (
                        <Input key={i} aria-label={`Minor ${i + 1} full name`} placeholder={`Minor ${i + 1} full name`} value={m} maxLength={100}
                          onChange={(e) => setMinors(minors.map((x, j) => (j === i ? e.target.value : x)))} />
                      ))}
                      {minors.length < 4 && <Button type="button" size="sm" variant="outline" onClick={() => setMinors([...minors, ""])}>Add another minor</Button>}
                    </div>
                  )}
                </div>
                <Label className="flex items-start gap-3 rounded-xl border p-3 text-sm font-normal">
                  <Checkbox checked={accessible} onCheckedChange={(v) => setAccessible(v === true)} className="mt-0.5" />
                  <span><span className="font-semibold">I need accessible seating</span><span className="block text-xs text-muted-foreground">Wheelchair space, step-free access or an aisle seat — our crew will save it for you.</span></span>
                </Label>
              </div>
            )}

            <Label className="flex items-start gap-3 rounded-xl bg-muted p-3 text-sm font-normal leading-snug">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              I agree to be filmed and recorded as part of the studio audience, and that footage may appear in IHNM Show broadcasts and online (<Link to="/filming-consent" target="_blank" className="underline">read the consent</Link>).
            </Label>
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy || !consent}>
              {type === "group" ? "Send group request" : full ? "Join waitlist" : "Reserve my seat"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
