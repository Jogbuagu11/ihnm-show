import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import worship from "@/assets/worship.jpg";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { VOLUNTEER_ROLES, type VolunteerRole } from "@/lib/volunteers";

export const Route = createFileRoute("/serve")({
  head: () => ({
    meta: [
      { title: "Serve With Us — IHNM Show Volunteers" },
      {
        name: "description",
        content:
          "Volunteer at IHNM Show tapings: camera, audio, ushers, safety, shuttle driving, hospitality, editing and social media.",
      },
      { property: "og:title", content: "Serve With Us — IHNM Show" },
      {
        property: "og:description",
        content: "Join the volunteer team behind every IHNM Show taping.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Serve,
});

const blurbs: Record<VolunteerRole, string> = {
  camera: "Run a camera during tapings — we'll train you.",
  audio: "Mic guests and ride the board.",
  ushers: "Welcome guests and guide seating.",
  safety: "Keep the room safe and calm.",
  shuttle_driver: "Drive shuttle loops (license and insurance required).",
  hospitality: "Green room, snacks and guest care.",
  editing: "Cut clips and episodes from home.",
  social: "Post moments and clips online.",
};

function Serve() {
  const { user, roles } = useAuth();
  const nav = useNavigate();
  const [picked, setPicked] = useState<VolunteerRole[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avail, setAvail] = useState("");
  const [busy, setBusy] = useState(false);
  async function join() {
    setBusy(true);
    const { error } = await supabase.rpc("join_volunteers", {
      _name: name,
      _phone: phone,
      _roles: picked,
      _availability: avail,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to the team!");
    window.location.assign("/volunteer");
  }
  return (
    <>
      <PageHeader image={worship} eyebrow="Volunteers" title="Serve With Us">
        Every taping runs on people who love the work behind the scenes. Find your spot.
      </PageHeader>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(VOLUNTEER_ROLES) as VolunteerRole[]).map((r) => (
            <li key={r}>
              <button
                type="button"
                onClick={() =>
                  setPicked(picked.includes(r) ? picked.filter((x) => x !== r) : [...picked, r])
                }
                className={`h-full w-full rounded-3xl border p-5 text-left transition ${picked.includes(r) ? "border-gold bg-stage text-stage-foreground" : "bg-card hover:border-gold/60"}`}
                aria-pressed={picked.includes(r)}
              >
                <p className="font-display text-2xl">{VOLUNTEER_ROLES[r]}</p>
                <p className="mt-1 text-sm opacity-80">{blurbs[r]}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="bg-secondary">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="display-lg">
            Sign <span className="italic-gold">up</span>
          </h2>
          {!user ? (
            <p className="mt-4 text-muted-foreground">
              Create an account or sign in first — then come back here to pick your roles.{" "}
              <Button asChild variant="gold" size="sm" className="ml-2">
                <Link to="/auth">Sign in</Link>
              </Button>
            </p>
          ) : roles.includes("volunteer") ? (
            <p className="mt-4">
              You're on the team.{" "}
              <Button
                variant="gold"
                size="sm"
                className="ml-2"
                onClick={() => nav({ to: "/volunteer" })}
              >
                Open my shifts
              </Button>
            </p>
          ) : (
            <div className="mt-6 grid gap-4 rounded-3xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Roles picked:{" "}
                {picked.length
                  ? picked.map((r) => VOLUNTEER_ROLES[r]).join(", ")
                  : "tap the cards above"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Full name</Label>
                  <Input
                    className="mt-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label>Mobile</Label>
                  <Input
                    className="mt-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>
              <div>
                <Label>When are you usually free?</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={avail}
                  onChange={(e) => setAvail(e.target.value)}
                  maxLength={1000}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={picked.includes("shuttle_driver")}
                  onCheckedChange={(v) =>
                    setPicked(
                      v
                        ? [...new Set([...picked, "shuttle_driver" as const])]
                        : picked.filter((x) => x !== "shuttle_driver"),
                    )
                  }
                />{" "}
                I can drive the shuttle (you'll upload your license and insurance next)
              </label>
              <Button
                variant="gold"
                disabled={busy || !name.trim() || !picked.length}
                onClick={join}
              >
                Join the volunteer team
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
