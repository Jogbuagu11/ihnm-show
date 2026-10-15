import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Facebook, Mail, MessageCircle, MessageSquare } from "lucide-react";
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
import {
  FIRST_ACCESS_COUNT,
  SPOTS_PER_REFERRAL,
  WAITLIST_SOURCES,
  positionLabel,
  readUrlAttribution,
  referralUrl,
  shareLinks,
  type JoinResult,
} from "@/lib/waitlist";
import { trackReferralShare, trackSignup } from "@/lib/analytics";

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

  if (result) return <JoinedPanel result={result} />;

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

function JoinedPanel({ result }: { result: JoinResult }) {
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => referralUrl(result.referral_code), [result.referral_code]);
  const links = useMemo(() => shareLinks(result.referral_code), [result.referral_code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      trackReferralShare("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  }

  const shares = [
    { label: "Text message", href: links.sms, icon: MessageSquare, channel: "sms" },
    { label: "WhatsApp", href: links.whatsapp, icon: MessageCircle, channel: "whatsapp" },
    { label: "Facebook", href: links.facebook, icon: Facebook, channel: "facebook" },
    { label: "X", href: links.x, icon: XIcon, channel: "x" },
    { label: "Email", href: links.email, icon: Mail, channel: "email" },
  ];

  return (
    <div
      className="rounded-3xl border border-gold/50 bg-card p-6 shadow-soft sm:p-8"
      aria-live="polite"
    >
      {result.already && (
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          You're already on the list
        </p>
      )}
      <h3 className="display-lg">
        {positionLabel(result.position).replace(/^You're /, "You're ")}
      </h3>
      {result.referral_count > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {result.referral_count} {result.referral_count === 1 ? "friend has" : "friends have"}{" "}
          joined with your link.
        </p>
      )}
      <p className="mt-4 text-muted-foreground">
        Each friend who joins moves you up {SPOTS_PER_REFERRAL} spots. The first{" "}
        {FIRST_ACCESS_COUNT} get first access to tickets.
      </p>

      <div className="mt-6">
        <Label
          htmlFor="wl-link"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          Your personal link
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="wl-link"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono text-sm"
          />
          <Button type="button" variant="gold" onClick={copy} className="shrink-0">
            {copied ? (
              <>
                <Check className="size-4" aria-hidden /> Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden /> Copy
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Share it
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {shares.map(({ label, href, icon: Icon, channel }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackReferralShare(channel)}
              className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm transition hover:border-gold hover:text-gold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon className="size-4" aria-hidden /> {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** lucide has no X/Twitter glyph, so draw the mark inline. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.9 2H22l-7.1 8.1L22.8 22h-6.6l-4.6-6.2L6.2 22H3l7.4-8.4L2.6 2h6.7l4.3 5.8L18.9 2Zm-1.2 18h1.8L7.4 3.8H5.5L17.7 20Z" />
    </svg>
  );
}
