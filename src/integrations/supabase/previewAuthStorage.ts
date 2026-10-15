// Supabase session storage. The Lovable preview broker this used to implement
// is gone; the browser's own localStorage is all that's needed.
export function brokeredPreviewStorage() {
  if (typeof window === "undefined") return undefined;
  return localStorage;
}
