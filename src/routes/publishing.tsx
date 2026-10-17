import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isBooksSite } from "@/lib/site";
import { PubFooter, PubHeader } from "@/components/publishing/layout";
import { PubCanonical } from "@/components/publishing/canonical";

/** Layout for every publishing page. The show's header and footer are
 *  suppressed in __root for this subtree, so the two sites read as separate
 *  while sharing one codebase and one deploy. */
export const Route = createFileRoute("/publishing")({
  // On the publishing domain these pages live at the root, so the prefixed
  // address redirects. Covers every page under /publishing in one place.
  beforeLoad: ({ location }) => {
    if (isBooksSite()) {
      throw redirect({ href: location.pathname.replace(/^\/publishing/, "") || "/" });
    }
  },
  component: PublishingLayout,
});

function PublishingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PubCanonical />
      <PubHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PubFooter />
    </div>
  );
}
