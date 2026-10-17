import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";

/** Header for the prelaunch home page only. The show nav (Watch, Tickets,
 *  Shuttle, Submit, Live, Rent) points at pages that stay thin until 2027, so
 *  on this page it competes with the single thing we want people to do.
 *
 *  No bottom border: the bar shares the hero's ivory, so the two read as one
 *  field rather than a bar sitting on top of it. */
export function PrelaunchHeader() {
  const { user, isStaff } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-ivory/85 text-walnut backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          to="/"
          className="font-display text-2xl tracking-tight focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          IHNM <span className="italic-gold">Show</span>
        </Link>

        <div className="flex items-center gap-5">
          {/* Staff keep a way back to their tools without the public nav. */}
          {isStaff && (
            <Link
              to="/crew"
              className="hidden font-mono text-xs uppercase tracking-[0.2em] text-walnut/70 hover:text-persimmon sm:inline"
            >
              Crew
            </Link>
          )}
          <UserMenu tone="dark" />
          <Button asChild variant="gold" size="sm" className="h-9 px-4 sm:px-5">
            {/* One flex child: Button is inline-flex with gap-2, so a bare text
                node beside a span would be spaced like two separate items. */}
            <a href="#waitlist">
              <span>
                Join<span className="hidden sm:inline"> the waitlist</span>
              </span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
