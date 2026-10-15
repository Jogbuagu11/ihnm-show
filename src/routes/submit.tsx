import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import worship from "@/assets/worship.jpg";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit — IHNM Show" },
      {
        name: "description",
        content:
          "Send IHNM Show a question, testimony, guest suggestion, or worship team application.",
      },
      { property: "og:title", content: "Be part of IHNM Show" },
      {
        property: "og:description",
        content: "Questions, stories, guest ideas and worship team applications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Submit,
});

const kinds = [
  { v: "question", l: "Audience question", p: "What question should we tackle on the show?" },
  { v: "testimony", l: "Testimony / story", p: "Share your story with us." },
  { v: "guest", l: "Guest or expert suggestion", p: "Who should we invite, and why?" },
  {
    v: "worship",
    l: "Worship team application",
    p: "Tell us about yourself, your instrument or voice, and links to your music.",
  },
];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  content: z.string().trim().min(10, "Please write a little more").max(4000),
});

function Submit() {
  const { user } = useAuth();
  const [kind, setKind] = useState("question");
  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [busy, setBusy] = useState(false);
  const k = kinds.find((x) => x.v === kind)!;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, email: form.email || user?.email || "" });
    if (!parsed.success)
      return toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
    setBusy(true);
    const { error } = await supabase
      .from("submissions")
      .insert({ ...parsed.data, kind, user_id: user?.id ?? null });
    setBusy(false);
    if (error) return toast.error("Could not send — please try again");
    toast.success("Thank you! Our team will review it.");
    setForm({ name: "", email: "", content: "" });
  }

  return (
    <>
      <PageHeader image={worship} eyebrow="Be part of the show" title="Submit" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kinds.map((x) => (
            <button
              key={x.v}
              onClick={() => setKind(x.v)}
              className={`rounded-xl px-3 py-3 text-left text-sm font-semibold ${kind === x.v ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted"}`}
            >
              {x.l}
            </button>
          ))}
        </div>
        <form onSubmit={send} className="mt-6 space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                placeholder={user?.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
              />
            </div>
          </div>
          <div>
            <Label>{k.l}</Label>
            <Textarea
              rows={6}
              placeholder={k.p}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              maxLength={4000}
            />
          </div>
          <Button variant="gold" size="lg" className="w-full" disabled={busy}>
            Send
          </Button>
        </form>
      </div>
    </>
  );
}
