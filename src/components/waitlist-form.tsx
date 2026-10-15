import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { joinWaitlist } from "@/lib/waitlist.functions";
import { ReferralPanel } from "@/components/referral-panel";
import { WAITLIST_SOURCES, readUrlAttribution, type JoinResult } from "@/lib/waitlist";
import { trackSignup } from "@/lib/analytics";

const SMS_CONSENT =
  "By checking this box you agree to receive text messages about tapings and ticket drops. Msg & data rates may apply. Reply STOP to opt out.";

type Attribution = ReturnType<typeof readUrlAttribution>;

export function WaitlistForm() {
  const [f, setF] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    zip: "",
    church_name: "",
  });
  const [source, setSource] = useState<string>("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [churchGroup, setChurchGroup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<JoinResult | null>(null);
  const [attribution, setAttribution] = useState<Attribution | null>(null);

  // ?ref= and utm_* are read once on mount and kept even if the user navigates.
  useEffect(() => {
    setAttribution(readUrlAttribution(window.location.search));
  }, []);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.first_name.trim() || !f.last_name.trim())
      return toast.error("Please enter your first and last name.");
    if (!f.email.includes("@")) return toast.error("Please enter a valid email address.");
    if (churchGroup && !f.church_name.trim()) return toast.error("Please add your church's name.");

    setBusy(true);
    try {
      const row = await joinWaitlist({
        data: {
          first_name: f.first_name,
          last_name: f.last_name,
          email: f.email,
          phone: f.phone || null,
          sms_opt_in: smsOptIn && !!f.phone.trim(),
          zip: f.zip || null,
          source: (source || null) as (typeof WAITLIST_SOURCES)[number] | null,
          church_group: churchGroup,
          church_name: churchGroup ? f.church_name : null,
          ref: attribution?.ref ?? null,
          utm_source: attribution?.utm_source ?? null,
          utm_medium: attribution?.utm_medium ?? null,
          utm_campaign: attribution?.utm_campaign ?? null,
          utm_term: attribution?.utm_term ?? null,
          utm_content: attribution?.utm_content ?? null,
        },
      });
      setResult(row);
      if (!row.already) {
        trackSignup({
          position: row.position,
          source: source || null,
          referred: !!attribution?.ref,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result)
    return (
      <ReferralPanel
        position={result.position}
        referralCode={result.referral_code}
        referralCount={result.referral_count}
        firstName={result.first_name}
        already={result.already}
        confirmed={result.confirmed}
        idPrefix="wl"
      />
    );

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-3xl border bg-card p-6 shadow-soft sm:grid-cols-2"
      noValidate
    >
      <div>
        <Label htmlFor="wl-first">First name</Label>
        <Input
          id="wl-first"
          className="mt-1"
          required
          autoComplete="given-name"
          maxLength={80}
          value={f.first_name}
          onChange={set("first_name")}
        />
      </div>
      <div>
        <Label htmlFor="wl-last">Last name</Label>
        <Input
          id="wl-last"
          className="mt-1"
          required
          autoComplete="family-name"
          maxLength={80}
          value={f.last_name}
          onChange={set("last_name")}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="wl-email">Email</Label>
        <Input
          id="wl-email"
          className="mt-1"
          type="email"
          required
          autoComplete="email"
          maxLength={255}
          value={f.email}
          onChange={set("email")}
        />
      </div>
      <div>
        <Label htmlFor="wl-phone">
          Mobile phone <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="wl-phone"
          className="mt-1"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          value={f.phone}
          onChange={set("phone")}
        />
      </div>
      <div>
        <Label htmlFor="wl-zip">
          ZIP code <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="wl-zip"
          className="mt-1"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={12}
          value={f.zip}
          onChange={set("zip")}
        />
      </div>

      <div className="sm:col-span-2">
        <div className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-4">
          <Checkbox
            id="wl-sms"
            checked={smsOptIn}
            disabled={!f.phone.trim()}
            onCheckedChange={(v) => setSmsOptIn(v === true)}
            className="mt-0.5"
          />
          <div className="text-sm">
            <Label htmlFor="wl-sms" className="font-medium">
              Text me about tapings and ticket drops
            </Label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {f.phone.trim() ? SMS_CONSENT : "Add a mobile number above to turn on text updates."}
            </p>
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="wl-source">How did you hear about us?</Label>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger id="wl-source" className="mt-1">
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            {WAITLIST_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="sm:col-span-2">
        <div className="flex items-center gap-3">
          <Checkbox
            id="wl-church"
            checked={churchGroup}
            onCheckedChange={(v) => setChurchGroup(v === true)}
          />
          <Label htmlFor="wl-church">Bringing a church group?</Label>
        </div>
        {churchGroup && (
          <div className="mt-3">
            <Label htmlFor="wl-church-name">Church name</Label>
            <Input
              id="wl-church-name"
              className="mt-1"
              maxLength={120}
              value={f.church_name}
              onChange={set("church_name")}
            />
          </div>
        )}
      </div>

      <Button type="submit" variant="gold" size="lg" className="sm:col-span-2" disabled={busy}>
        {busy ? "Saving your spot…" : "Join the waitlist"}
      </Button>
      <p className="sm:col-span-2 text-center text-xs text-muted-foreground">
        We'll only email you about the show. Read our{" "}
        <a href="/privacy" className="underline hover:text-gold">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
