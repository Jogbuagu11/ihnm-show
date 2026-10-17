import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Signing out previously lived only at the bottom of /account, two clicks in
 *  and invisible from the Crew Portal. This puts it in the header everywhere. */
export function UserMenu({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user, isStaff, roles } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (!user) return null;

  const isAdmin = roles.includes("admin");
  const label = user.email?.split("@")[0] ?? "Account";

  async function signOut() {
    // Clear cached queries before dropping the session, or another user's data
    // can flash on screen after the next sign-in.
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={
            tone === "dark"
              ? "h-9 gap-1.5 px-3 text-stage-foreground hover:bg-stage-foreground/10 hover:text-gold"
              : "h-9 gap-1.5 px-3 text-walnut hover:text-persimmon"
          }
        >
          <span className="max-w-[9rem] truncate">{label}</span>
          <ChevronDown className="size-3.5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => navigate({ to: "/account" })}>
          My account
        </DropdownMenuItem>
        {isStaff && (
          <DropdownMenuItem onSelect={() => navigate({ to: "/crew" })}>
            Crew Portal
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem onSelect={() => navigate({ to: "/finance" })}>Finance</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="size-4" aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
