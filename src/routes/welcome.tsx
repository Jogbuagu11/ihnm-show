import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [{ title: "Your account is ready — IHNM Show" }, { name: "robots", content: "noindex" }],
  }),
  component: Welcome,
});

/** Where the "Confirm your email" link lands after sign-up.
 *
 *  Supabase signs the account in as part of verifying the link, so previously
 *  this dropped people straight onto /account with no indication that anything
 *  had succeeded. This says so plainly, and still works if the session didn't
 *  carry over (different browser, expired link). */
function Welcome() {
  const { user, isStaff, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Give supabase-js a moment to turn the link's tokens into a session.
    supabase.auth.getSession().then(() => setChecked(true));
  }, []);

  const signedIn = !!user;

  return (
    <section className="mx-auto max-w-xl px-4 py-20">
      <div className="rounded-3xl border border-gold/50 bg-card p-8 text-center shadow-soft">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>

        <h1 className="display-lg mt-6">
          Your account is <span className="italic-gold">ready</span>.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Your email is confirmed. You can reserve seats and keep your tickets in one place.
        </p>

        {!checked || loading ? (
          <p className="mt-8 text-sm text-muted-foreground">One moment…</p>
        ) : signedIn ? (
          <>
            <p className="mt-6 text-sm text-muted-foreground">You're already signed in.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to={isStaff ? "/crew" : "/account"}>
                  {isStaff ? "Go to the portal" : "Go to my account"}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">Back to the home page</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              Sign in to pick up where you left off.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/auth">Sign in now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">Back to the home page</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
