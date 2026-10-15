import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — IHNM Show" },
      { name: "description", content: "Sign in to reserve seats and see your IHNM Show tickets." },
      { property: "og:title", content: "Sign in — IHNM Show" },
      { property: "og:description", content: "Reserve seats and manage your tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, isStaff, roles, loading } = useAuth();
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || loading) return;
    const back = sessionStorage.getItem("ihnm_return");
    if (back) {
      sessionStorage.removeItem("ihnm_return");
      window.location.assign(back);
      return;
    }
    if (admin) {
      // roles load right after the session; wait briefly before deciding
      const t = setTimeout(
        () =>
          navigate({ to: roles.includes("admin") ? "/finance" : isStaff ? "/crew" : "/account" }),
        600,
      );
      return () => clearTimeout(t);
    }
    navigate({ to: "/account" });
  }, [user, loading, admin, roles, isStaff, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/account` },
          });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up") toast.success("Check your email to confirm your account.");
  }

  async function google() {
    // Requires the Google provider to be enabled in Supabase Auth.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) toast.error("Google sign-in failed");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div
        role="tablist"
        aria-label="Sign-in type"
        className="mx-auto mb-8 flex w-fit rounded-full border border-gold/50 p-1 font-mono text-xs uppercase tracking-[0.2em]"
      >
        {[
          { v: false, l: "Audience" },
          { v: true, l: "Admin & Crew" },
        ].map((o) => (
          <button
            key={o.l}
            role="tab"
            aria-selected={admin === o.v}
            onClick={() => {
              setAdmin(o.v);
              setMode("in");
            }}
            className={`rounded-full px-4 py-2 ${admin === o.v ? "bg-stage text-stage-foreground" : "text-muted-foreground"}`}
          >
            {o.l}
          </button>
        ))}
      </div>
      {admin ? (
        <>
          <h1 className="text-center text-4xl">
            Admin <span className="italic-gold">sign in</span>
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            For producers and crew. You'll go straight to your portal.
          </p>
          <div className="mt-8 space-y-4 rounded-3xl border border-gold/50 bg-stage p-6 text-stage-foreground shadow-glow">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="a-email">Email</Label>
                <Input
                  id="a-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-stage-foreground/30 bg-stage-foreground/10 text-stage-foreground"
                />
              </div>
              <div>
                <Label htmlFor="a-pass">Password</Label>
                <Input
                  id="a-pass"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-stage-foreground/30 bg-stage-foreground/10 text-stage-foreground"
                />
              </div>
              <Button variant="gold" className="w-full" disabled={busy}>
                Sign in to portal
              </Button>
            </form>
            <Button variant="hero" className="w-full rounded-full" onClick={google}>
              Continue with Google
            </Button>
            {/* Account creation lives on the Audience tab, so a first-time
                admin or new crew member otherwise hits a dead end here. */}
            <p className="text-center text-xs text-stage-foreground/70">
              New here? Create your account on the{" "}
              <button
                type="button"
                onClick={() => {
                  setAdmin(false);
                  setMode("up");
                }}
                className="underline underline-offset-2 hover:text-gold"
              >
                Audience tab
              </button>
              , then ask an admin for crew access.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-center text-4xl font-semibold">
            {mode === "in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            Reserve seats and keep your tickets in one place.
          </p>
          <div className="mt-8 space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
            <Button variant="outline" className="w-full rounded-full" onClick={google}>
              Continue with Google
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button variant="pill" className="w-full" disabled={busy}>
                {mode === "in" ? "Sign in" : "Sign up"}
              </Button>
            </form>
            <button
              className="w-full text-center text-sm text-walnut"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
