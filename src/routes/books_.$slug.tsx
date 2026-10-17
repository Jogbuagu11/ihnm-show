import { createFileRoute, redirect } from "@tanstack/react-router";
import { IMPRINT } from "@/lib/publishing";
import { BookPage } from "./publishing.books_.$slug";
import { isBooksSite } from "@/lib/site";

export const Route = createFileRoute("/books_/$slug")({
  beforeLoad: ({ params }) => {
    if (!isBooksSite()) throw redirect({ href: `/publishing/books/${params.slug}` });
  },
  head: () => ({ meta: [{ title: `Book — ${IMPRINT}` }] }),
  component: BookRoute,
});

function BookRoute() {
  const { slug } = Route.useParams();
  return <BookPage slug={slug} />;
}
