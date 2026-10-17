import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";
import { siteSettingsQuery } from "@/lib/settings";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/watch", label: "Watch", flag: "show_watch" },
  { to: "/tickets", label: "Tickets", flag: "show_tickets" },
  { to: "/shuttle", label: "Shuttle", flag: "show_shuttle" },
  { to: "/submit", label: "Submit", flag: "show_submit" },
  { to: "/live", label: "Live", flag: "show_live" },
  { to: "/rent", label: "Rent Studio", flag: "show_rent" },
] as const;

export function SiteHeader() {
  const { user, isStaff, roles } = useAuth();
  const { data: settings } = useQuery(siteSettingsQuery);
  // Staff keep every link so hidden pages stay reachable while being built.
  const visible = links.filter((l) => isStaff || (settings?.[l.flag] ?? false));
  const isAdmin = roles.includes("admin");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  // The desktop bar uses UserMenu; the hamburger needs its own control.
  async function signOutMobile() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <header className="sticky top-0 z-40 border-b border-gold/30 bg-stage/95 text-stage-foreground backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-2xl tracking-tight">
          IHNM <span className="italic-gold">Show</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {visible.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-mono text-xs uppercase tracking-[0.2em] text-stage-foreground/90 hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              {l.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              to="/crew"
              className="font-mono text-xs uppercase tracking-[0.2em] text-stage-foreground/90 hover:text-gold"
            >
              Crew
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/finance"
              className="font-mono text-xs uppercase tracking-[0.2em] text-stage-foreground/90 hover:text-gold"
            >
              Finance
            </Link>
          )}
          <Button asChild variant="gold" size="sm" className="h-9 px-4">
            <Link to={user ? "/account" : "/auth"}>{user ? "My Tickets" : "Sign in"}</Link>
          </Button>
          <UserMenu tone="dark" />
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          className="flex flex-col gap-1 border-t border-gold/30 px-4 py-3 font-display text-2xl md:hidden"
          onClick={() => setOpen(false)}
        >
          {visible.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 font-medium hover:text-gold">
              {l.label}
            </Link>
          ))}
          {isStaff && (
            <Link to="/crew" className="rounded-lg px-3 py-2 font-medium hover:text-gold">
              Crew Portal
            </Link>
          )}
          {isAdmin && (
            <Link to="/finance" className="rounded-lg px-3 py-2 font-medium hover:text-gold">
              Finance
            </Link>
          )}
          {roles.includes("volunteer") && (
            <Link to="/volunteer" className="rounded-lg px-3 py-2 font-medium hover:text-gold">
              My Shifts
            </Link>
          )}
          {user && (
            <Link to="/bookings" className="rounded-lg px-3 py-2 font-medium hover:text-gold">
              My Bookings
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            className="rounded-lg px-3 py-2 font-semibold italic text-gold"
          >
            {user ? "My Tickets" : "Sign in"}
          </Link>
          {user && (
            <button
              onClick={signOutMobile}
              className="rounded-lg px-3 py-2 text-left font-medium hover:text-gold"
            >
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
