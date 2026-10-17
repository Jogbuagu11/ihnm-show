import { createFileRoute, redirect } from "@tanstack/react-router";
import { pubAuthorsHead, Authors } from "./publishing.authors";
import { isBooksSite } from "@/lib/site";

export const Route = createFileRoute("/authors")({
  beforeLoad: () => {
    if (!isBooksSite()) throw redirect({ href: "/publishing/authors" });
  },
  head: pubAuthorsHead,
  component: Authors,
});
