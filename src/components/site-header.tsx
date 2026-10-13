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
] as const;

export function SiteHeader() {
  const { user, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-walnut">
          IHNM <span className="text-gold">Show</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {l.label}
            </Link>
          ))}
          {isStaff && <Link to="/crew" className="text-sm font-medium text-muted-foreground hover:text-foreground">Crew</Link>}
          <Button asChild variant="pill" size="sm" className="h-9 px-4">
            <Link to={user ? "/account" : "/auth"}>{user ? "My Tickets" : "Sign in"}</Link>
          </Button>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 font-medium hover:bg-muted">{l.label}</Link>
          ))}
          {isStaff && <Link to="/crew" className="rounded-lg px-3 py-2 font-medium hover:bg-muted">Crew Portal</Link>}
          <Link to={user ? "/account" : "/auth"} className="rounded-lg px-3 py-2 font-semibold text-walnut hover:bg-muted">
            {user ? "My Tickets" : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
