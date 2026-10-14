import { useState } from "react";
import { Youtube, Instagram, Facebook, Music2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LOCATION } from "@/lib/show";
import { siteSettingsQuery } from "@/lib/settings";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: settings } = useQuery(siteSettingsQuery);
  async function join(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) return toast.error("Please enter a valid email");
    setBusy(true);
    const { error } = await supabase.from("newsletter_signups").insert({ email: parsed.data.toLowerCase() });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) return toast.error("Could not sign you up");
    toast.success("You're on the list for ticket drops!");
    setEmail("");
  }
  const socials = [
    { icon: Youtube, label: "YouTube" },
    { icon: Instagram, label: "Instagram" },
    { icon: Music2, label: "TikTok" },
    { icon: Facebook, label: "Facebook" },
  ];
  return (
    <footer className="mt-24 bg-stage text-stage-foreground border-t border-gold/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="display-lg">IHNM <span className="italic-gold">Show</span></p>
          <p className="mt-2 text-sm opacity-80">Scripture. History. Today's Headlines.</p>
          <p className="mt-4 flex items-center gap-2 text-sm"><MapPin className="size-4 text-gold" /> {LOCATION}</p>
        </div>
        <div>
          <p className="eyebrow text-gold">Follow</p>
          <div className="mt-4 flex gap-3">
            {socials.map(({ icon: Icon, label }) => (
              <a key={label} href="#" aria-label={label} className="flex size-10 items-center justify-center rounded-full border border-stage-foreground/30 hover:bg-stage-foreground/10">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <form onSubmit={join}>
          <p className="eyebrow text-gold">Ticket drops</p>
          <p className="mt-2 text-sm opacity-80">Be first to know when new tapings open.</p>
          <div className="mt-4 flex gap-2">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="border-stage-foreground/30 bg-stage-foreground/10 text-stage-foreground placeholder:text-stage-foreground/60" />
            <Button variant="gold" disabled={busy}>Join</Button>
          </div>
        </form>
      </div>
      <nav aria-label="Legal and more" className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 pb-4 font-mono text-[0.7rem] uppercase tracking-[0.2em]">
        <Link to="/terms" className="hover:text-gold">Terms</Link>
        <Link to="/privacy" className="hover:text-gold">Privacy Policy</Link>
        <Link to="/filming-consent" className="hover:text-gold">Audience Filming Consent</Link>
        {settings?.giving_enabled && <Link to="/give" className="hover:text-gold">Partner Giving</Link>}
        {settings?.merch_enabled && <Link to="/merch" className="hover:text-gold">Merch</Link>}
      </nav>
      <p className="pb-8 text-center text-xs text-stage-foreground/80">© {new Date().getFullYear()} IHNM Show</p>
    </footer>
  );
}
