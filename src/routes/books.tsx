import { createFileRoute, redirect } from "@tanstack/react-router";
import { pubBooksHead, Books } from "./publishing.books";
import { isBooksSite } from "@/lib/site";

// Publishing owns the root on its own domain. On the show's domain the same
// page lives under /publishing, and this path redirects there so one piece of
// content never sits at two addresses.
export const Route = createFileRoute("/books")({
  beforeLoad: () => {
    if (!isBooksSite()) throw redirect({ href: "/publishing/books" });
  },
  head: pubBooksHead,
  component: Books,
});
