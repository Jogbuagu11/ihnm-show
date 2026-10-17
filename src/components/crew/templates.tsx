import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Template = {
  key: string;
  brand: "show" | "publishing";
  subject: string;
  html: string;
  updated_at: string;
};

/** Merge fields the runner fills in. Anything else in braces renders empty
 *  rather than printing the placeholder, so a typo loses a word instead of
 *  showing {frist_name} to a reader. */
const FIELDS = [
  "first_name",
  "email",
  "site_url",
  "referral_url",
  "unsubscribe_url",
  "media_kit_url",
  "position",
  "amount",
  "taping_date",
  "shift_date",
  "role",
  "episode_url",
  "topic",
  "book_title",
];

const SAMPLE: Record<string, string> = {
  first_name: "Ada",
  email: "ada@example.com",
  site_url: "https://www.ihnmshow.com",
  referral_url: "https://www.ihnmshow.com/?ref=ABC123",
  unsubscribe_url: "https://www.ihnmshow.com/unsubscribe",
  media_kit_url: "https://www.ihnmshow.com/media-kit.pdf",
  position: "42",
  amount: "$50",
  taping_date: "Saturday 6 March",
  shift_date: "Saturday 6 March, 5pm",
  role: "Door",
  episode_url: "https://www.ihnmshow.com/watch/episode-one",
  topic: "the exile",
  book_title: "A Long Obedience",
};

const fill = (text: string) => text.replace(/\{(\w+)\}/g, (_m, k: string) => SAMPLE[k] ?? "");

export function TemplatesAdmin() {
  const qc = useQueryClient();

  // Sends to whoever is signed in, decided server-side from the JWT. There is
  // deliberately no address field: this cannot be pointed at anyone else.
  const sendTest = useMutation({
    mutationFn: async (key: string) => {
      const { data, error } = await supabase.functions.invoke<{ sent_to: string }>(
        "send-test-email",
        { body: { template: key } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => toast.success(`Sent to ${d?.sent_to ?? "you"}.`),
    onError: (e: unknown) => {
      const raw =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "";
      toast.error(raw || "Could not send that.");
    },
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["crew", "templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("brand")
        .order("key");
      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });

  // Steps pointing at a template nobody has written. These are what hold a
  // journey switched off, so they belong in this list, not buried elsewhere.
  const { data: wanted = [] } = useQuery({
    queryKey: ["crew", "templates-wanted"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("unwritten_templates");
      if (error) throw error;
      return (data ?? []) as { template_key: string; journey_name: string }[];
    },
  });

  const save = useMutation({
    mutationFn: async (t: { key: string; subject: string; html: string; brand?: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .upsert({
          key: t.key,
          subject: t.subject,
          html: t.html,
          ...(t.brand ? { brand: t.brand as "show" | "publishing" } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("key", t.key);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved.");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["crew", "templates"] });
      void qc.invalidateQueries({ queryKey: ["crew", "templates-wanted"] });
      void qc.invalidateQueries({ queryKey: ["crew", "journeys"] });
    },
    onError: (e: unknown) => {
      const raw =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "";
      toast.error(raw || "Could not save that.");
    },
  });

  function open(t: Template) {
    setEditing(t.key);
    setSubject(t.subject);
    setHtml(t.html);
  }

  function openNew(key: string) {
    setEditing(key);
    setSubject("");
    setHtml("<p></p>");
  }

  const current = templates.find((t) => t.key === editing);
  const isNew = editing !== null && !current;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Email templates</h2>
        <p className="mt-1 text-sm text-ink/60">
          The body only. Every marketing send is wrapped in the brand layout, and the unsubscribe
          link and mailing address are added underneath — you do not write those, and you cannot
          leave them out.
        </p>
      </div>

      {wanted.length > 0 && (
        <div className="rounded-xl bg-blush p-4">
          <p className="font-medium text-blush-foreground">
            {wanted.length} email{wanted.length === 1 ? "" : "s"} still to write
          </p>
          <p className="mt-1 text-sm text-blush-foreground/80">
            A journey cannot be switched on until every email it sends exists.
          </p>
          <ul className="mt-3 space-y-1">
            {wanted.map((w) => (
              <li key={w.template_key} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="font-mono text-xs">{w.template_key}</span>
                  <span className="text-blush-foreground/70"> — {w.journey_name}</span>
                </span>
                <Button size="sm" variant="outline" onClick={() => openNew(w.template_key)}>
                  <span>Write it</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing !== null && (
        <div className="space-y-4 rounded-xl bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm">{editing}</p>
            <button className="text-sm text-ink/60 underline" onClick={() => setEditing(null)}>
              Close
            </button>
          </div>

          <div>
            <Label htmlFor="t-subject">Subject</Label>
            <Input
              id="t-subject"
              className="mt-1"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="t-html">Body</Label>
            <Textarea
              id="t-html"
              className="mt-1 font-mono text-sm"
              rows={12}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
            />
            <p className="mt-2 text-xs text-ink/60">
              HTML. Use <code>&lt;p&gt;</code> for paragraphs and{" "}
              <code>&lt;a class=&quot;btn&quot; href=&quot;…&quot;&gt;</code> for a button. Links
              are rewritten to tracked redirects when the email goes out.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              Merge fields
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {FIELDS.map((f) => (
                <button
                  key={f}
                  className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-gold/30"
                  onClick={() => setHtml((h) => `${h}{${f}}`)}
                >
                  {`{${f}}`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/60">
              A field the event does not carry renders as nothing, so a reader never sees a
              placeholder. {`{taping_date}`}, {`{amount}`} and the like only work in journeys whose
              trigger carries them.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              Preview with sample values
            </p>
            <div className="mt-2 rounded-lg border border-ink/10 p-4">
              <p className="mb-3 border-b border-ink/10 pb-2 text-sm font-medium">
                {fill(subject) || <span className="text-ink/40">No subject</span>}
              </p>
              <div
                className="prose-sm [&_a]:underline [&_p]:mb-3"
                // The author is an admin editing their own site's email copy.
                dangerouslySetInnerHTML={{ __html: fill(html) }}
              />
              <p className="mt-4 border-t border-ink/10 pt-2 text-xs text-ink/50">
                IHNM Show · your mailing address · Unsubscribe
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="gold"
              disabled={save.isPending || !subject.trim()}
              onClick={() =>
                save.mutate({
                  key: editing,
                  subject,
                  html,
                  ...(isNew ? { brand: "show" } : {}),
                })
              }
            >
              <span>{save.isPending ? "Saving…" : isNew ? "Create" : "Save"}</span>
            </Button>
            {!isNew && (
              <Button
                variant="outline"
                disabled={sendTest.isPending}
                onClick={() => sendTest.mutate(editing)}
              >
                <span>{sendTest.isPending ? "Sending…" : "Send it to me"}</span>
              </Button>
            )}
            {!isNew && (
              <span className="text-xs text-ink/50">
                Sends the saved version, not unsaved edits.
              </span>
            )}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {templates.map((t) => (
          <li
            key={t.key}
            className="flex items-center justify-between gap-4 rounded-xl bg-white p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{t.subject}</p>
              <p className="font-mono text-xs text-ink/50">
                {t.key} · {t.brand === "publishing" ? "Publishing" : "Show"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={sendTest.isPending}
                onClick={() => sendTest.mutate(t.key)}
              >
                <span>Send to me</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => open(t)}>
                <span>Edit</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
