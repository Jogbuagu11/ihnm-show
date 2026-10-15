import { useMemo, useState } from "react";
import { Check, Copy, Facebook, Mail, MessageCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FIRST_ACCESS_COUNT,
  SPOTS_PER_REFERRAL,
  positionLabel,
  referralUrl,
  shareLinks,
} from "@/lib/waitlist";
import { trackReferralShare } from "@/lib/analytics";

/** Shared by the post-signup panel and the confirm page so the two can't drift
 *  — the confirm page used to show the link with no way to copy or send it. */
export function ReferralPanel({
  position,
  referralCode,
  referralCount = 0,
  firstName,
  already = false,
  confirmed = true,
  idPrefix = "ref",
}: {
  position: number;
  referralCode: string;
  referralCount?: number;
  firstName?: string;
  already?: boolean;
  confirmed?: boolean;
  idPrefix?: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => referralUrl(referralCode), [referralCode]);
  const links = useMemo(() => shareLinks(referralCode), [referralCode]);
  const inputId = `${idPrefix}-link`;

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
      {already && (
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          You're already on the list
        </p>
      )}

      <h2 className="display-lg">{positionLabel(position)}</h2>

      {referralCount > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {referralCount} {referralCount === 1 ? "friend has" : "friends have"} joined with your
          link.
        </p>
      )}

      {!confirmed && (
        <p className="mt-4 rounded-2xl bg-secondary/70 p-4 text-sm">
          <strong>Check your email to confirm your spot.</strong> Your place is held, and referrals
          start counting once you've confirmed.
        </p>
      )}

      {/* The old copy named the link but never said what to do with it. */}
      <h3 className="mt-6 font-display text-2xl">Want to move up the list?</h3>
      <p className="mt-2 text-muted-foreground">
        Send the link below to friends{firstName ? `, ${firstName}` : ""}. Every friend who joins
        through it moves you up <strong>{SPOTS_PER_REFERRAL} spots</strong> — and the first{" "}
        {FIRST_ACCESS_COUNT} people on the list get first access to tickets.
      </p>

      <div className="mt-5">
        <Label
          htmlFor={inputId}
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          Your personal link
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id={inputId}
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
                <Copy className="size-4" aria-hidden /> Copy link
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Or send it straight to someone
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
