import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, fmtTime, LOCATION } from "@/lib/show";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/release/$token")({
  head: () => ({
    meta: [
      { title: "Appearance Release — IHNM Show" },
      { name: "description", content: "Sign your IHNM Show appearance release." },
      { property: "og:title", content: "IHNM Show Appearance Release" },
      { property: "og:description", content: "Sign your appearance release." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReleasePage,
});

type Rel = {
  name: string;
  role: string;
  theme: string;
  starts_at: string;
  signed_at: string | null;
};

function ReleasePage() {
  const { token } = Route.useParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["release", token],
    queryFn: async () => (await supabase.rpc("get_release", { _token: token })).data as Rel | null,
  });
  const [sig, setSig] = useState("");
  const [agree, setAgree] = useState(false);

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.rpc("sign_release", { _token: token, _signature: sig });
    if (error) return toast.error(error.message);
    toast.success("Release signed — thank you!");
    refetch();
  }

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!data) return <p className="p-10 text-center">This release link isn't valid.</p>;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="eyebrow">
        {data.role === "worship" ? "Worship team" : "Guest"} appearance release
      </p>
      <h1 className="mt-2 text-4xl">{data.name}</h1>
      <p className="mt-2 text-muted-foreground">
        {data.theme} · {fmtDate(data.starts_at)} · {fmtTime(data.starts_at)} · {LOCATION}
      </p>
      <div className="mt-6 space-y-3 rounded-2xl bg-secondary p-5 text-sm leading-relaxed">
        <p>
          [Placeholder release text] I grant IHNM Show and its producers the right to record, edit
          and distribute my appearance, name, image, voice and likeness, in any media worldwide, in
          perpetuity, for broadcast, online and promotional use, without payment.
        </p>
        <p>
          [Placeholder] I confirm that anything I perform or present is my own or that I have
          permission to use it.
        </p>
      </div>
      {data.signed_at ? (
        <p className="mt-6 rounded-xl bg-success/15 p-4 font-semibold text-success">
          ✓ Signed on {fmtDate(data.signed_at)}
        </p>
      ) : (
        <form onSubmit={sign} className="mt-6 space-y-4">
          <Label className="flex items-start gap-3 text-sm font-normal">
            <Checkbox
              checked={agree}
              onCheckedChange={(v) => setAgree(v === true)}
              className="mt-0.5"
            />{" "}
            I have read and agree to this release.
          </Label>
          <div>
            <Label htmlFor="sig">Type your full name to sign</Label>
            <Input id="sig" value={sig} onChange={(e) => setSig(e.target.value)} maxLength={120} />
          </div>
          <Button variant="gold" size="lg" disabled={!agree || sig.trim().length < 2}>
            Sign release
          </Button>
        </form>
      )}
    </div>
  );
}
