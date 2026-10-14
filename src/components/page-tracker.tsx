import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function sourceOf(): string {
  const p = new URLSearchParams(window.location.search);
  const utm = p.get("utm_source");
  if (utm) return utm.slice(0, 100).toLowerCase();
  if (!document.referrer) return "direct";
  try {
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return "direct";
    return host.slice(0, 100);
  } catch {
    return "direct";
  }
}

/** Logs one anonymous page view per route change (skips crew pages). */
export function PageTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const source = useRef<string | null>(null);
  useEffect(() => {
    if (path.startsWith("/crew")) return;
    let sid = sessionStorage.getItem("ihnm_sid");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("ihnm_sid", sid);
      sessionStorage.setItem("ihnm_src", sourceOf());
    }
    source.current ??= sessionStorage.getItem("ihnm_src") ?? "direct";
    supabase.from("page_views").insert({ path: path.slice(0, 300), source: source.current, session_id: sid }).then(() => {});
  }, [path]);
  return null;
}
