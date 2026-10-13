import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/account` } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "up") toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-4xl font-semibold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-center text-muted-foreground">Reserve seats and keep your tickets in one place.</p>
      <div className="mt-8 space-y-4 rounded-3xl border bg-card p-6 shadow-soft">
        <Button variant="outline" className="w-full rounded-full" onClick={google}>Continue with Google</Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button variant="pill" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
        </form>
        <button className="w-full text-center text-sm text-walnut" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
