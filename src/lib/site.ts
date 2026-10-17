import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";

/** The publishing site has its own domain. Both sites share one route tree,
 *  so six paths — /, /submit, /contact, /faq, /privacy and /terms — exist for
 *  both and have to be decided by host. The server reads the request and the
 *  client reads the address bar; they agree, so hydration matches. */
export const isBooksSite = createIsomorphicFn()
  .server(() => {
    try {
      return (getRequestHost() ?? "").toLowerCase().startsWith("books.");
    } catch {
      // No request in scope (a build-time render, say): the show is the default.
      return false;
    }
  })
  .client(() => window.location.hostname.toLowerCase().startsWith("books."));

export const BOOKS_HOST = "books.ihnmshow.com";
