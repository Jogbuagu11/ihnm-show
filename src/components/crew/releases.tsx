import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Taping } from "@/lib/queries";
import { fmtShortDate } from "@/lib/show";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Releases({ taping }: { taping: Taping }) {
  const { data = [], refetch } = useQuery({
    queryKey: ["crew", "releases", taping.id],
    queryFn: async () =>
      (
        await supabase
          .from("guest_releases")
          .select("*")
          .eq("taping_id", taping.id)
          .order("created_at")
      ).data ?? [],
  });
  const [f, setF] = useState({ name: "", email: "", role: "guest" });
  const link = (token: string) => `${window.location.origin}/release/${token}`;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Name is required");
    const { error } = await supabase.from("guest_releases").insert({
      taping_id: taping.id,
      name: f.name.trim().slice(0, 120),
      email: f.email.trim() || null,
      role: f.role,
    });
    if (error) return toast.error(error.message);
    toast.success("Added — send them their release link");
    setF({ name: "", email: "", role: f.role });
    refetch();
  }

  return (
    <div className="grid gap-6 py-4 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={add} className="space-y-3 rounded-3xl border bg-card p-5">
        <h3 className="text-xl font-semibold">Add guest or worship team</h3>
        <p className="text-sm text-muted-foreground">
          {taping.theme} · {fmtShortDate(taping.starts_at)}
        </p>
        <div>
          <Label>Name</Label>
          <Input
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            maxLength={120}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            maxLength={255}
          />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guest">Guest</SelectItem>
              <SelectItem value="worship">Worship team</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="gold">Add & create release</Button>
      </form>
      <ul className="space-y-2">
        {data.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary p-4 text-sm"
          >
            <span>
              <span className="font-semibold">{r.name}</span>{" "}
              <span className="text-muted-foreground">
                · {r.role === "worship" ? "Worship team" : "Guest"}
              </span>
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${r.signed_at ? "bg-success/15 text-success" : "bg-blush text-blush-foreground"}`}
              >
                {r.signed_at ? `Signed ${fmtShortDate(r.signed_at)}` : "Unsigned"}
              </span>
            </span>
            {!r.signed_at && (
              <span className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(link(r.token));
                    toast.success("Link copied");
                  }}
                >
                  <Copy /> Copy link
                </Button>
                {r.email && (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`mailto:${r.email}?subject=${encodeURIComponent("IHNM Show appearance release")}&body=${encodeURIComponent(`Hi ${r.name},\n\nPlease sign your appearance release for "${taping.theme}":\n${link(r.token)}\n\nThank you!`)}`}
                    >
                      <Mail /> Email
                    </a>
                  </Button>
                )}
              </span>
            )}
          </li>
        ))}
        {data.length === 0 && (
          <li className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            No guests added for this taping yet.
          </li>
        )}
      </ul>
    </div>
  );
}
