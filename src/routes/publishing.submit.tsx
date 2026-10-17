import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, IMPRINT, pubSettingsQuery, type PubCategory } from "@/lib/publishing";
import { notifySubmission } from "@/lib/publishing.functions";

export const Route = createFileRoute("/publishing/submit")({
  head: () => ({
    meta: [
      { title: `Submit your manuscript — ${IMPRINT}` },
      {
        name: "description",
        content:
          "Send us your manuscript. We never charge authors to publish, and you keep your copyright.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Submit,
});

const MAX_MB = 10;
const ACCEPT = ".pdf,.doc,.docx";

function Submit() {
  const { data: settings } = useQuery(pubSettingsQuery);
  const weeks = settings?.response_weeks ?? 8;

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    book_title: "",
    word_count: "",
    pitch: "",
    synopsis: "",
    author_bio: "",
    platform: "",
  });
  const [category, setCategory] = useState<PubCategory>("faith");
  const [status, setStatus] = useState<"complete" | "in_progress">("complete");
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.email.includes("@"))
      return toast.error("Please add your name and email.");
    if (!f.book_title.trim()) return toast.error("Please add your book's title.");
    if (!f.pitch.trim()) return toast.error("Please add a one-paragraph pitch.");
    if (!rights || !terms) return toast.error("Please tick both boxes to submit.");
    if (file && file.size > MAX_MB * 1024 * 1024)
      return toast.error(`That file is over ${MAX_MB} MB. Please send a smaller one.`);

    setBusy(true);
    // The id is generated here: anon can insert but deliberately cannot read a
    // submission back, so there is no way to return it.
    const id = crypto.randomUUID();
    let filePath: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      filePath = `${id}/first-chapters.${ext}`;
      const up = await supabase.storage.from("manuscripts").upload(filePath, file);
      if (up.error) {
        setBusy(false);
        console.error("[publishing] upload failed", up.error);
        return toast.error("We couldn't upload that file. Please try again.");
      }
    }

    const { error } = await supabase.from("pub_submissions").insert({
      id,
      name: f.name.trim(),
      email: f.email.trim().toLowerCase(),
      phone: f.phone.trim() || null,
      book_title: f.book_title.trim(),
      category,
      word_count: f.word_count ? Number(f.word_count.replace(/[^0-9]/g, "")) : null,
      manuscript_status: status,
      pitch: f.pitch.trim(),
      synopsis: f.synopsis.trim() || null,
      author_bio: f.author_bio.trim() || null,
      platform: f.platform.trim() || null,
      file_path: filePath,
      rights_confirmed: rights,
      terms_confirmed: terms,
    });
    setBusy(false);

    if (error) {
      console.error("[publishing] submission failed", error);
      return toast.error("We couldn't send your submission. Please try again.");
    }

    setSent(true);
    // Confirmation to the writer, notification to us. Already saved, so a mail
    // failure must not look like a failed submission.
    notifySubmission({ data: { id } }).catch((err: unknown) =>
      console.error("[publishing] notification failed", err),
    );
  }

  if (sent) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h1 className="display-lg mt-6">Thank you — we have it.</h1>
        <p className="mt-4 text-muted-foreground">
          We read everything that comes in. You'll hear from us within {weeks} weeks, whatever the
          answer. We've sent a confirmation to {f.email}.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <p className="eyebrow">— Submissions</p>
      <h1 className="display-lg mt-4">Submit your manuscript</h1>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="font-display text-xl">What we publish</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nonfiction on faith, history and Christian living. Select fiction later. Work that takes
            Scripture seriously and the reader's intelligence seriously too.
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="font-display text-xl">What we don't</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Poetry collections, children's picture books, and anything already published elsewhere,
            including self-published titles still for sale.
          </p>
        </div>
      </div>

      <p className="mt-5 rounded-3xl border border-gold/50 bg-secondary/60 p-5 text-sm">
        <strong>We never charge authors to publish.</strong> We pay for editing, cover design,
        layout and distribution. You keep your copyright and earn royalties. If anyone asks you for
        money to be published, it is not us.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 grid gap-4 rounded-3xl border bg-white p-6 sm:grid-cols-2"
        noValidate
      >
        <div>
          <Label htmlFor="s-name">Your name</Label>
          <Input
            id="s-name"
            required
            maxLength={120}
            className="mt-1"
            value={f.name}
            onChange={set("name")}
          />
        </div>
        <div>
          <Label htmlFor="s-email">Email</Label>
          <Input
            id="s-email"
            type="email"
            required
            maxLength={255}
            className="mt-1"
            value={f.email}
            onChange={set("email")}
          />
        </div>
        <div>
          <Label htmlFor="s-phone">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="s-phone"
            type="tel"
            maxLength={40}
            className="mt-1"
            value={f.phone}
            onChange={set("phone")}
          />
        </div>
        <div>
          <Label htmlFor="s-title">Book title</Label>
          <Input
            id="s-title"
            required
            maxLength={200}
            className="mt-1"
            value={f.book_title}
            onChange={set("book_title")}
          />
        </div>
        <div>
          <Label htmlFor="s-cat">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as PubCategory)}>
            <SelectTrigger id="s-cat" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="s-words">Word count</Label>
          <Input
            id="s-words"
            inputMode="numeric"
            className="mt-1"
            value={f.word_count}
            onChange={set("word_count")}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="s-status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "complete" | "in_progress")}>
            <SelectTrigger id="s-status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="s-pitch">Your pitch — one paragraph</Label>
          <Textarea
            id="s-pitch"
            required
            rows={3}
            maxLength={2000}
            className="mt-1"
            value={f.pitch}
            onChange={set("pitch")}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="s-syn">Short synopsis</Label>
          <Textarea
            id="s-syn"
            rows={5}
            maxLength={8000}
            className="mt-1"
            value={f.synopsis}
            onChange={set("synopsis")}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="s-bio">About you</Label>
          <Textarea
            id="s-bio"
            rows={3}
            maxLength={4000}
            className="mt-1"
            value={f.author_bio}
            onChange={set("author_bio")}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="s-platform">
            Your platform{" "}
            <span className="font-normal text-muted-foreground">
              (social links, email list size, speaking)
            </span>
          </Label>
          <Textarea
            id="s-platform"
            rows={2}
            maxLength={2000}
            className="mt-1"
            value={f.platform}
            onChange={set("platform")}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="s-file">First three chapters (PDF or Word, up to {MAX_MB} MB)</Label>
          <div className="mt-1 flex items-center gap-3">
            <Input
              id="s-file"
              type="file"
              accept={ACCEPT}
              className="cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && <Upload className="size-4 shrink-0 text-gold" aria-hidden />}
          </div>
        </div>

        <div className="space-y-3 sm:col-span-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="s-rights"
              checked={rights}
              onCheckedChange={(v) => setRights(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="s-rights" className="font-normal">
              I own the rights to this work.
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="s-terms"
              checked={terms}
              onCheckedChange={(v) => setTerms(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="s-terms" className="font-normal">
              I've read the submission terms below.
            </Label>
          </div>
        </div>

        <Button variant="gold" size="lg" className="sm:col-span-2" disabled={busy}>
          {busy ? "Sending…" : "Send my submission"}
        </Button>
      </form>

      <section className="mt-12 rounded-3xl border bg-secondary/40 p-6 text-sm text-muted-foreground">
        <h2 className="font-display text-xl text-foreground">Submission terms</h2>
        <p className="mt-3">
          We read every submission and reply within {weeks} weeks, whatever the answer.
        </p>
        <p className="mt-3">
          We receive a great many manuscripts and some will be similar to yours. We cannot be
          responsible for similarities between work we publish and work submitted to us, and
          submitting does not create any obligation on our part.
        </p>
        <p className="mt-3">
          We keep submissions confidential and share them only with the people reading for us.
          Declined manuscripts and their files are deleted six months after we reply.
        </p>
      </section>
    </section>
  );
}
