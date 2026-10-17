import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { siteSettingsQuery, type SiteSettings } from "@/lib/settings";

type Draft = Partial<SiteSettings>;

const PAGE_FLAGS: { k: keyof SiteSettings; label: string; hint: string }[] = [
  {
    k: "show_watch",
    label: "Watch / episodes",
    hint: "Currently showing seeded sample episodes — keep hidden until real ones exist.",
  },
  {
    k: "show_tickets",
    label: "Tickets",
    hint: "Currently offers Reserve on seeded sample tapings — keep hidden until real dates are set.",
  },
  { k: "show_shuttle", label: "Shuttle", hint: "Shuttle booking for a taping." },
  { k: "show_live", label: "Live", hint: "The live stream page." },
  { k: "show_submit", label: "Submit a question", hint: "Audience question submissions." },
  {
    k: "show_rent",
    label: "Studio A hire",
    hint: "Studio rental enquiries — a real revenue line today.",
  },
  { k: "show_serve", label: "Serve with us", hint: "Volunteer signup." },
  { k: "show_prayer", label: "Prayer & testimony", hint: "Prayer request form." },
];

const TEXT_FIELDS: { k: keyof SiteSettings; label: string; hint?: string }[] = [
  { k: "sms_keyword", label: "SMS keyword", hint: 'Shown as "Text KEYWORD to …"' },
  { k: "sms_number", label: "SMS number", hint: "Leave blank to show “number coming soon”" },
  {
    k: "substack_url",
    label: "Substack URL",
    hint: "Powers the newsletter button and footer icon",
  },
  { k: "url_youtube", label: "YouTube URL" },
  { k: "url_instagram", label: "Instagram URL" },
  { k: "url_tiktok", label: "TikTok URL" },
  { k: "url_facebook", label: "Facebook URL" },
  { k: "url_nextdoor", label: "Nextdoor URL" },
];

export function PrelaunchSettings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery(siteSettingsQuery);
  const [draft, setDraft] = useState<Draft>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Seed the form once the row arrives, without clobbering in-progress edits.
  useEffect(() => {
    if (settings && Object.keys(draft).length === 0) setDraft(settings);
  }, [settings, draft]);

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({
          hero_headline: (draft.hero_headline ?? "").trim() || "Be in the first audience.",
          hero_subline: (draft.hero_subline ?? "").trim(),
          ticket_drop_at: draft.ticket_drop_at ?? null,
          sms_keyword: (draft.sms_keyword ?? "IHNM").trim() || "IHNM",
          sms_number: blank(draft.sms_number),
          substack_url: blank(draft.substack_url),
          url_youtube: blank(draft.url_youtube),
          url_instagram: blank(draft.url_instagram),
          url_tiktok: blank(draft.url_tiktok),
          url_facebook: blank(draft.url_facebook),
          url_nextdoor: blank(draft.url_nextdoor),
          weekly_position_emails: draft.weekly_position_emails ?? false,
          require_email_confirm: draft.require_email_confirm ?? false,
          show_watch: draft.show_watch ?? false,
          show_tickets: draft.show_tickets ?? false,
          show_shuttle: draft.show_shuttle ?? false,
          show_live: draft.show_live ?? false,
          show_submit: draft.show_submit ?? false,
          show_rent: draft.show_rent ?? true,
          show_serve: draft.show_serve ?? true,
          show_prayer: draft.show_prayer ?? true,
          giving_enabled: draft.giving_enabled ?? false,
          giving_blurb: blank(draft.giving_blurb),
          giving_zelle: blank(draft.giving_zelle),
          giving_check_payable_to: blank(draft.giving_check_payable_to),
          giving_mailing_address: blank(draft.giving_mailing_address),
          org_mailing_address: blank(draft.org_mailing_address),
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved.");
      void qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadKit = useMutation({
    mutationFn: async (file: File) => {
      if (file.type !== "application/pdf") throw new Error("The media kit needs to be a PDF.");
      const path = `media-kit-${Date.now()}.pdf`;
      const up = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: "application/pdf" });
      if (up.error) throw up.error;
      const { error } = await supabase
        .from("site_settings")
        .update({ media_kit_path: path })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Media kit uploaded.");
      void qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // <input type="datetime-local"> wants a local "YYYY-MM-DDTHH:mm" value.
  const dropLocal = draft.ticket_drop_at ? toLocalInput(new Date(draft.ticket_drop_at)) : "";

  return (
    <div className="mt-4 space-y-6">
      <section className="rounded-2xl border bg-card p-4">
        <p className="eyebrow">— Hero</p>
        <div className="mt-3 grid gap-3">
          <div>
            <Label htmlFor="s-headline">Headline</Label>
            <Input
              id="s-headline"
              className="mt-1"
              maxLength={120}
              value={draft.hero_headline ?? ""}
              onChange={(e) => set("hero_headline", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="s-subline">Subline</Label>
            <Textarea
              id="s-subline"
              className="mt-1"
              rows={2}
              maxLength={400}
              value={draft.hero_subline ?? ""}
              onChange={(e) => set("hero_subline", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="s-drop">Ticket drop date</Label>
            <Input
              id="s-drop"
              type="datetime-local"
              className="mt-1"
              value={dropLocal}
              onChange={(e) =>
                set(
                  "ticket_drop_at",
                  e.target.value ? new Date(e.target.value).toISOString() : null,
                )
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank and the hero countdown is hidden entirely.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <p className="eyebrow">— Links &amp; SMS</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TEXT_FIELDS.map(({ k, label, hint }) => (
            <div key={k}>
              <Label htmlFor={`s-${k}`}>{label}</Label>
              <Input
                id={`s-${k}`}
                className="mt-1"
                maxLength={300}
                value={(draft[k] as string | null) ?? ""}
                onChange={(e) => set(k, e.target.value as SiteSettings[typeof k])}
              />
              {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <p className="eyebrow">— Media kit</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {settings?.media_kit_path
            ? `Currently serving the uploaded PDF (${settings.media_kit_path}).`
            : "No upload yet — the bundled placeholder PDF is being served."}
        </p>
        <Button
          variant="outline"
          className="mt-3"
          disabled={uploadKit.isPending}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />{" "}
          {uploadKit.isPending ? "Uploading…" : "Upload media kit PDF"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadKit.mutate(file);
            e.target.value = "";
          }}
        />
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <p className="eyebrow">— Giving</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in at least one method or the Give page shows "giving opens soon". Online card giving
          stays off until Stripe is connected.
        </p>
        <div className="mt-3 grid gap-3">
          <div>
            <Label htmlFor="s-giving_blurb">What gifts pay for</Label>
            <Textarea
              id="s-giving_blurb"
              className="mt-1"
              rows={3}
              maxLength={600}
              value={draft.giving_blurb ?? ""}
              onChange={(e) => set("giving_blurb", e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-giving_zelle">Zelle email or phone</Label>
              <Input
                id="s-giving_zelle"
                className="mt-1"
                maxLength={120}
                value={draft.giving_zelle ?? ""}
                onChange={(e) => set("giving_zelle", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="s-giving_check_payable_to">Cheques payable to</Label>
              <Input
                id="s-giving_check_payable_to"
                className="mt-1"
                maxLength={120}
                value={draft.giving_check_payable_to ?? ""}
                onChange={(e) => set("giving_check_payable_to", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="s-org_mailing_address">Mailing address for email footers</Label>
            <Textarea
              id="s-org_mailing_address"
              className="mt-1"
              rows={2}
              maxLength={200}
              value={draft.org_mailing_address ?? ""}
              onChange={(e) => set("org_mailing_address", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              United States law requires a physical mailing address in every marketing email, and
              the footer prints whatever is here. Use a PO box. Until this is filled in, the footer
              goes out without one.
            </p>
          </div>
          <div>
            <Label htmlFor="s-giving_mailing_address">Mailing address for cheques</Label>
            <Textarea
              id="s-giving_mailing_address"
              className="mt-1"
              rows={3}
              maxLength={300}
              value={draft.giving_mailing_address ?? ""}
              onChange={(e) => set("giving_mailing_address", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This is published. Use a PO box rather than a home address.
            </p>
          </div>
          <Toggle
            id="s-giving_online"
            label="Online card giving"
            hint="Needs Stripe. Leave off until it is connected, or the page shows a button that cannot take a payment."
            checked={draft.giving_online_enabled ?? false}
            onChange={(v) => set("giving_online_enabled", v)}
            disabled
          />
          <Toggle
            id="s-giving_enabled"
            label="Show Give in the footer"
            hint="Links the Give page from the site footer."
            checked={draft.giving_enabled ?? false}
            onChange={(v) => set("giving_enabled", v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <p className="eyebrow">— Pages visible to the public</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Hidden pages stay fully working for you when signed in as staff, so they can be built
          before anyone else sees them. Visitors get a "coming soon" page instead, and the page
          drops out of the menu and the sitemap.
        </p>
        <div className="mt-4 space-y-3">
          {PAGE_FLAGS.map(({ k, label, hint }) => (
            <Toggle
              key={k}
              id={`s-${k}`}
              label={label}
              hint={hint}
              checked={(draft[k] as boolean) ?? false}
              onChange={(v) => set(k, v as SiteSettings[typeof k])}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <p className="eyebrow">— Email behaviour</p>
        <div className="mt-3 space-y-4">
          <Toggle
            id="s-confirm"
            label="Require email confirmation"
            hint="Off by default: there is no transactional sender yet, so signups count immediately and referrals credit on signup. Turn on once a sender is connected and referrals will only credit after the friend confirms."
            checked={draft.require_email_confirm ?? false}
            onChange={(v) => set("require_email_confirm", v)}
          />
          {/* Deliberately disabled: nothing sends these yet. A switch that
              silently does nothing is worse than one that says so. */}
          <Toggle
            id="s-weekly"
            label="Weekly position-update emails"
            hint="Not built yet — there is no scheduled job to send these, so turning it on would do nothing. The setting is kept so it can be switched on the day a sender exists."
            checked={false}
            disabled
            onChange={() => undefined}
          />
        </div>
      </section>

      <Button variant="gold" disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3${disabled ? " opacity-60" : ""}`}>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="mt-1"
      />
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 max-w-prose text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

const blank = (v: string | null | undefined) => {
  const s = v?.trim();
  return s ? s : null;
};

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
