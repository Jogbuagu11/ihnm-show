import { createFileRoute, redirect } from "@tanstack/react-router";
import { IMPRINT } from "@/lib/publishing";
import { AuthorPage } from "./publishing.authors_.$slug";
import { isBooksSite } from "@/lib/site";

export const Route = createFileRoute("/authors_/$slug")({
  beforeLoad: ({ params }) => {
    if (!isBooksSite()) throw redirect({ href: `/publishing/authors/${params.slug}` });
  },
  head: () => ({ meta: [{ title: `Author — ${IMPRINT}` }] }),
  component: AuthorRoute,
});

function AuthorRoute() {
  const { slug } = Route.useParams();
  return <AuthorPage slug={slug} />;
}
