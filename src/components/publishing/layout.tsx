import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMPRINT, OPERATOR, TAGLINE, pubPath } from "@/lib/publishing";

const NAV = [
  { to: pubPath("/books"), label: "Books" },
  { to: pubPath("/authors"), label: "Authors" },
  { to: pubPath("/how-it-works"), label: "How it works" },
  { to: pubPath("/faq"), label: "FAQ" },
];

export function PubHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-gold/30 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to={pubPath()} className="font-display text-xl tracking-tight text-walnut">
          IHNM <span className="italic-gold">Publishing</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-mono text-xs uppercase tracking-[0.2em] text-walnut/75 hover:text-persimmon"
            >
              {l.label}
            </Link>
          ))}
          <Button asChild variant="gold" size="sm" className="h-9 px-4">
            <Link to={pubPath("/submit")}>Submit your manuscript</Link>
          </Button>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav
          className="flex flex-col gap-1 border-t border-gold/30 px-4 py-3 font-display text-xl md:hidden"
          onClick={() => setOpen(false)}
        >
          {NAV.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 hover:text-persimmon">
              {l.label}
            </Link>
          ))}
          <Link to={pubPath("/submit")} className="rounded-lg px-3 py-2 italic text-gold">
            Submit your manuscript
          </Link>
        </nav>
      )}
    </header>
  );
}

export function PubFooter() {
  return (
    <footer className="mt-24 border-t border-gold/30 bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-walnut">
            IHNM <span className="italic-gold">Publishing</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{TAGLINE}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            {IMPRINT} is operated by {OPERATOR}.
          </p>
        </div>
        <nav aria-label="Publishing" className="text-sm">
          <p className="eyebrow">Explore</p>
          <ul className="mt-3 space-y-1.5">
            {NAV.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground hover:text-persimmon">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to={pubPath("/submit")} className="text-muted-foreground hover:text-persimmon">
                Submit your manuscript
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="More" className="text-sm">
          <p className="eyebrow">More</p>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link to={pubPath("/contact")} className="text-muted-foreground hover:text-persimmon">
                Contact
              </Link>
            </li>
            <li>
              <Link to={pubPath("/privacy")} className="text-muted-foreground hover:text-persimmon">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to={pubPath("/terms")} className="text-muted-foreground hover:text-persimmon">
                Terms of Use
              </Link>
            </li>
            <li>
              {/* Relative, so it keeps working when this moves to its own domain. */}
              <a
                href="https://www.ihnmshow.com"
                className="text-muted-foreground hover:text-persimmon"
              >
                IHNM Show
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {OPERATOR}
      </p>
    </footer>
  );
}
