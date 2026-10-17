import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PubFooter, PubHeader } from "@/components/publishing/layout";

/** Layout for every publishing page. The show's header and footer are
 *  suppressed in __root for this subtree, so the two sites read as separate
 *  while sharing one codebase and one deploy. */
export const Route = createFileRoute("/publishing")({
  component: PublishingLayout,
});

function PublishingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PubHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PubFooter />
    </div>
  );
}
