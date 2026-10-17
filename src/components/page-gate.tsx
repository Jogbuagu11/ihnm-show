import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { siteSettingsQuery, type SiteSettings } from "@/lib/settings";

export type GatedPage = Extract<
  keyof SiteSettings,
  | "show_watch"
  | "show_tickets"
  | "show_shuttle"
  | "show_live"
  | "show_submit"
  | "show_rent"
  | "show_serve"
  | "show_prayer"
>;

/** Hides a page from the public during prelaunch while leaving it fully
 *  working for staff, so it can be built and reviewed on the real site rather
 *  than commented out. Flip the switch in Crew Portal -> Settings. */
export function PageGate({
  page,
  title,
  children,
}: {
  page: GatedPage;
  title: string;
  children: ReactNode;
}) {
  const { data: settings, isLoading } = useQuery(siteSettingsQuery);
  const { isStaff, loading } = useAuth();

  // Render nothing rather than flashing the holding page at a member of staff
  // while the settings are still loading.
  if (isLoading || loading) return null;

  const visible = settings?.[page] ?? false;

  if (visible) return <>{children}</>;

  if (isStaff) {
    return (
      <>
        <div className="border-b border-gold/40 bg-secondary">
          <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-sm">
            <EyeOff className="size-4 shrink-0 text-gold" aria-hidden />
            <span>
              <strong>Hidden from the public.</strong> You can see this because you're staff. Turn
              it on in Crew Portal → Settings.
            </span>
          </p>
        </div>
        {children}
      </>
    );
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="eyebrow">— Coming soon</p>
      <h1 className="display-lg mt-4">{title}</h1>
      <p className="mt-4 text-muted-foreground">
        This opens closer to our first taping. Join the waitlist and we'll tell you the moment it
        does.
      </p>
      <Button asChild variant="gold" size="lg" className="mt-8">
        <Link to="/">Join the waitlist</Link>
      </Button>
    </section>
  );
}
