import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset your password — IHNM Show" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

const MIN_PASSWORD = 8;

/** Three ways in, because the reset email can carry either a link or a code:
 *  - "request": ask for an email and send the reset
 *  - "code":    type the 6-digit code from that email
 *  - "set":     choose the new password (reached by link, or after a code) */
type Stage = "loading" | "request" | "code" | "set" | "done";

function ResetPassword() {
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // Arriving from the emailed link leaves a recovery session in the URL, which
  // supabase-js picks up and turns into a session. If one exists we can go
  // straight to choosing a password.
  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && active) setStage("set");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setStage(data.session ? "set" : "request");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter the email on your account.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    // Don't reveal whether the address exists.
    if (error) console.error("[auth] reset request failed", error);
    toast.success("If that address has an account, a reset email is on its way.");
    setStage("code");
  }

  async function useCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length < 6) return toast.error("Enter the 6-digit code from the email.");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "recovery",
    });
    setBusy(false);
    if (error) return toast.error("That code didn't work. It may have expired.");
    setStage("set");
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD)
      return toast.error(`Use at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return toast.error("Those passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    setStage("done");
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <p className="eyebrow">— Account</p>
      <h1 className="display-lg mt-3">
        Reset your <span className="italic-gold">password</span>
      </h1>

      {stage === "loading" && <p className="mt-6 text-muted-foreground">One moment…</p>}

      {stage === "request" && (
        <form onSubmit={sendReset} className="mt-8 space-y-4 rounded-3xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            We'll email you a link and a code — either one gets you in.
          </p>
          <div>
            <Label htmlFor="rp-email">Email</Label>
            <Input
              id="rp-email"
              type="email"
              required
              autoComplete="email"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button variant="gold" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset email"}
          </Button>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={useCode} className="mt-8 space-y-4 rounded-3xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Check <strong>{email}</strong>. Click the button in that email, or type the 6-digit code
            from it here.
          </p>
          <div>
            <Label htmlFor="rp-code">6-digit code</Label>
            <Input
              id="rp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              placeholder="123456"
              className="mt-1 font-mono text-lg tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <Button variant="gold" className="w-full" disabled={busy}>
            {busy ? "Checking…" : "Use this code"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-walnut underline-offset-2 hover:underline"
            onClick={() => setStage("request")}
          >
            Send it to a different address
          </button>
        </form>
      )}

      {stage === "set" && (
        <form onSubmit={savePassword} className="mt-8 space-y-4 rounded-3xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>
          <div>
            <Label htmlFor="rp-new">New password</Label>
            <Input
              id="rp-new"
              type="password"
              required
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              className="mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              At least {MIN_PASSWORD} characters.
            </p>
          </div>
          <div>
            <Label htmlFor="rp-confirm">Confirm new password</Label>
            <Input
              id="rp-confirm"
              type="password"
              required
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              className="mt-1"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button variant="gold" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Save new password"}
          </Button>
        </form>
      )}

      {stage === "done" && (
        <div className="mt-8 rounded-3xl border border-gold/50 bg-card p-6" aria-live="polite">
          <h2 className="font-display text-2xl">
            Password <span className="italic-gold">updated</span>.
          </h2>
          <p className="mt-2 text-muted-foreground">You're signed in with your new password.</p>
          <Button asChild variant="gold" className="mt-5">
            <a href="/account">Go to my account</a>
          </Button>
        </div>
      )}
    </section>
  );
}
