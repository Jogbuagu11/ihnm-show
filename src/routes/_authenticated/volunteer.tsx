import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/show";
import { VOLUNTEER_ROLES, openSlots, shiftHours, type VolunteerRole } from "@/lib/volunteers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/volunteer")({
  head: () => ({
    meta: [
      { title: "My Shifts — IHNM Show Volunteers" },
      {
        name: "description",
        content: "Claim open volunteer shifts and track your hours at IHNM Show.",
      },
      { property: "og:title", content: "My Shifts — IHNM Show" },
      { property: "og:description", content: "Volunteer shifts and hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Volunteer,
});

const TZ = "America/Los_Angeles";
const tm = (d: string) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

function Volunteer() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-vol", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [v, s, o, c] = await Promise.all([
        supabase.from("volunteers").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("shifts").select("*, taping:tapings(theme,starts_at)").order("starts_at"),
        supabase.rpc("shift_openings"),
        supabase.from("shift_claims").select("*").eq("user_id", user!.id),
      ]);
      return {
        vol: v.data,
        shifts: s.data ?? [],
        open: new Map((o.data ?? []).map((x) => [x.shift_id, x.claimed])),
        mine: c.data ?? [],
      };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-vol"] });
  if (isLoading) return null;
  if (!data?.vol)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl">Not on the team yet</h1>
        <p className="mt-2 text-muted-foreground">Sign up to volunteer first.</p>
        <Button asChild variant="gold" className="mt-4">
          <Link to="/serve">Serve With Us</Link>
        </Button>
      </div>
    );
  const vol = data.vol;
  const mineActive = new Map(
    data.mine.filter((c) => c.status !== "released").map((c) => [c.shift_id, c]),
  );
  const upcoming = data.shifts.filter((s) => new Date(s.ends_at) > new Date());
  const hours = data.mine
    .filter((c) => c.status === "served")
    .reduce((a, c) => {
      const s = data.shifts.find((x) => x.id === c.shift_id);
      return a + (c.hours != null ? Number(c.hours) : s ? shiftHours(s) : 0);
    }, 0);

  async function act(id: string, claim: boolean) {
    const { error } = claim
      ? await supabase.rpc("claim_shift", { _shift: id })
      : await supabase.rpc("release_shift", { _shift: id });
    if (error) return toast.error(error.message);
    toast.success(claim ? "Shift claimed — thank you!" : "Shift released");
    refresh();
  }
  async function upload(kind: "license" | "insurance", file?: File) {
    if (!file || !user) return;
    const path = `${user.id}/${kind}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("volunteer-docs").upload(path, file);
    if (error) return toast.error("Upload failed");
    await supabase
      .from("volunteers")
      .update(kind === "license" ? { license_path: path } : { insurance_path: path })
      .eq("user_id", user.id);
    toast.success("Uploaded — only admins can see it");
    refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="eyebrow">Volunteer</p>
      <h1 className="text-4xl">
        My <span className="italic-gold">Shifts</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        {vol.roles.map((r) => VOLUNTEER_ROLES[r as VolunteerRole] ?? r).join(", ")} ·{" "}
        <span className="font-semibold text-foreground">{hours.toFixed(1)} hours served</span>
      </p>

      {vol.roles.includes("shuttle_driver") && (
        <div className="mt-6 grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-2">
          <p className="sm:col-span-2 text-sm">
            Shuttle drivers: upload your driver's license and proof of insurance. Only admins can
            view them.
          </p>
          <div>
            <Label>Driver's license {vol.license_path && "✓"}</Label>
            <Input
              className="mt-1"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => upload("license", e.target.files?.[0])}
            />
          </div>
          <div>
            <Label>Insurance {vol.insurance_path && "✓"}</Label>
            <Input
              className="mt-1"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => upload("insurance", e.target.files?.[0])}
            />
          </div>
        </div>
      )}

      <h2 className="mt-8 text-2xl">Open & upcoming shifts</h2>
      <ul className="mt-3 grid gap-3">
        {upcoming.map((s) => {
          const mine = mineActive.get(s.id);
          const left = openSlots(s.slots, data.open.get(s.id) ?? 0);
          const taping = s.taping as { theme: string; starts_at: string } | null;
          return (
            <li
              key={s.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${mine ? "border-gold bg-stage text-stage-foreground" : "bg-card"}`}
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-75">
                  {taping ? fmtDate(taping.starts_at) : ""} · {tm(s.starts_at)}–{tm(s.ends_at)}
                </p>
                <p className="font-display text-xl">
                  {VOLUNTEER_ROLES[s.role as VolunteerRole] ?? s.role}{" "}
                  <span className="text-sm opacity-75">· {taping?.theme}</span>
                </p>
                <p className="text-xs opacity-75">
                  {mine ? "You're on this shift" : `${left} of ${s.slots} spots open`}
                </p>
              </div>
              {mine ? (
                <Button size="sm" variant="hero" onClick={() => act(s.id, false)}>
                  Release
                </Button>
              ) : (
                <Button size="sm" variant="gold" disabled={!left} onClick={() => act(s.id, true)}>
                  {left ? "Claim shift" : "Full"}
                </Button>
              )}
            </li>
          );
        })}
        {!upcoming.length && (
          <li className="text-muted-foreground">No shifts posted yet — check back soon.</li>
        )}
      </ul>
    </div>
  );
}
