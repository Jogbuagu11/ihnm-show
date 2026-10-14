import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/watch", label: "Watch" },
  { to: "/tickets", label: "Tickets" },
  { to: "/shuttle", label: "Shuttle" },
  { to: "/submit", label: "Submit" },
  { to: "/live", label: "Live" },
  { to: "/rent", label: "Rent Studio" },
] as const;

export function SiteHeader() {
  const { user, isStaff, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-gold/30 bg-stage/95 text-stage-foreground backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-2xl tracking-tight">
          IHNM <span className="italic-gold">Show</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="font-mono text-xs uppercase tracking-[0.2em] text-stage-foreground/90 hover:text-gold" activeProps={{ className: "text-gold" }}>
              {l.label}
            </Link>
          ))}
          {isStaff && <Link to="/crew" className="font-mono text-xs uppercase tracking-[0.2em] text-stage-foreground/90 hover:text-gold">Crew</Link>}
          {isAdmin && <Link to="/finance" className="font-mono text-xs uppercase tracking-[0.2em] text-stage-foreground/90 hover:text-gold">Finance</Link>}
          <Button asChild variant="gold" size="sm" className="h-9 px-4">
            <Link to={user ? "/account" : "/auth"}>{user ? "My Tickets" : "Sign in"}</Link>
          </Button>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-gold/30 px-4 py-3 font-display text-2xl md:hidden" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 font-medium hover:text-gold">{l.label}</Link>
          ))}
          {isStaff && <Link to="/crew" className="rounded-lg px-3 py-2 font-medium hover:text-gold">Crew Portal</Link>}
          {isAdmin && <Link to="/finance" className="rounded-lg px-3 py-2 font-medium hover:text-gold">Finance</Link>}
          {roles.includes("volunteer") && <Link to="/volunteer" className="rounded-lg px-3 py-2 font-medium hover:text-gold">My Shifts</Link>}
          {user && <Link to="/bookings" className="rounded-lg px-3 py-2 font-medium hover:text-gold">My Bookings</Link>}
          <Link to={user ? "/account" : "/auth"} className="rounded-lg px-3 py-2 font-semibold italic text-gold">
            {user ? "My Tickets" : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
