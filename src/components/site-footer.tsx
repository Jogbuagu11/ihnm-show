import { Youtube, Instagram, Facebook, Music2, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LOCATION } from "@/lib/show";
import { siteSettingsQuery } from "@/lib/settings";
import { NextdoorIcon, SubstackIcon } from "@/components/social-icons";

export function SiteFooter() {
  const { data: settings } = useQuery(siteSettingsQuery);

  // Only render a channel once its URL is set in admin, so the row never shows
  // dead links.
  const socials = [
    { label: "YouTube", href: settings?.url_youtube, icon: Youtube },
    { label: "Instagram", href: settings?.url_instagram, icon: Instagram },
    { label: "TikTok", href: settings?.url_tiktok, icon: Music2 },
    { label: "Facebook", href: settings?.url_facebook, icon: Facebook },
    { label: "Nextdoor", href: settings?.url_nextdoor, icon: NextdoorIcon },
    { label: "Substack", href: settings?.substack_url, icon: SubstackIcon },
  ].filter((s): s is { label: string; href: string; icon: typeof Youtube } => !!s.href);

  return (
    <footer className="mt-24 border-t border-gold/40 bg-stage text-stage-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
        <div>
          <p className="display-lg">
            IHNM <span className="italic-gold">Show</span>
          </p>
          <p className="mt-2 text-sm opacity-80">Scripture. History. Today's Headlines.</p>
          <p className="mt-4 flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-gold" aria-hidden /> {LOCATION}
          </p>
        </div>
        {socials.length > 0 && (
          <div className="md:text-right">
            <p className="eyebrow text-gold">Follow</p>
            <ul className="mt-4 flex gap-3 md:justify-end">
              {socials.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-full border border-stage-foreground/30 transition hover:border-gold hover:text-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <nav
        aria-label="Legal and more"
        className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 pb-4 font-mono text-[0.7rem] uppercase tracking-[0.2em]"
      >
        <Link to="/about" className="hover:text-gold">
          About
        </Link>
        <Link to="/faq" className="hover:text-gold">
          Audience FAQ
        </Link>
        {settings?.show_serve && (
          <Link to="/serve" className="hover:text-gold">
            Serve With Us
          </Link>
        )}
        {settings?.show_prayer && (
          <Link to="/prayer" className="hover:text-gold">
            Prayer &amp; Testimony
          </Link>
        )}
        <Link to="/partner" className="hover:text-gold">
          Partner With Us
        </Link>
        <Link to="/contact" className="hover:text-gold">
          Contact
        </Link>
        <Link to="/terms" className="hover:text-gold">
          Terms
        </Link>
        <Link to="/privacy" className="hover:text-gold">
          Privacy Policy
        </Link>
        <Link to="/filming-consent" className="hover:text-gold">
          Audience Filming Consent
        </Link>
        {/* The prelaunch header drops the nav, so this is the way to /auth. */}
        <Link to="/auth" className="hover:text-gold">
          Sign in
        </Link>
        {settings?.giving_enabled && (
          <Link to="/give" className="hover:text-gold">
            Partner Giving
          </Link>
        )}
        {settings?.merch_enabled && (
          <Link to="/merch" className="hover:text-gold">
            Merch
          </Link>
        )}
      </nav>
      <p className="pb-8 text-center text-xs text-stage-foreground/80">
        © {new Date().getFullYear()} IHNM Show
      </p>
    </footer>
  );
}
