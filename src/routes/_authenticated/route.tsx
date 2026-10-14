import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      if (location.pathname === "/checkin") sessionStorage.setItem("ihnm_return", location.pathname + location.search);
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
