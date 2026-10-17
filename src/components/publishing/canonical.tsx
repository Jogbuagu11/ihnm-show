import { useRouterState } from "@tanstack/react-router";
import { BOOKS_HOST } from "@/lib/site";

/** The same publishing page is reachable at books.ihnmshow.com/books and at
 *  www.ihnmshow.com/publishing/books. Both stay reachable on purpose, so one
 *  of them has to be named as the original or search engines pick for us.
 *  React 19 hoists this into the head from wherever it renders. */
export function PubCanonical() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const clean = pathname.replace(/^\/publishing/, "") || "/";
  return <link rel="canonical" href={`https://${BOOKS_HOST}${clean === "/" ? "" : clean}`} />;
}
