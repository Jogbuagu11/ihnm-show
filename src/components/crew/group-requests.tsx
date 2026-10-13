import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtShortDate } from "@/lib/show";
import { Button } from "@/components/ui/button";

export function GroupRequests() {
  const qc = useQueryClient();
  const { data = [], refetch } = useQuery({
    queryKey: ["crew", "groups"],
    queryFn: async () => (await supabase.from("group_requests").select("*, taping:tapings(theme, starts_at)").order("created_at", { ascending: false })).data ?? [],
  });
  async function decide(id: string, approve: boolean) {
    const { error } = await supabase.rpc("decide_group_request", { _req: id, _approve: approve });
    if (error) return toast.error(error.message);
    toast.success(approve ? "Approved — seats reserved" : "Declined");
    refetch();
    qc.invalidateQueries({ queryKey: ["crew"] });
  }
  return (
    <ul className="space-y-3 py-4">
      {data.map((g) => (
        <li key={g.id} className="rounded-2xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{g.church_name} · {g.seats} seats</p>
              <p className="text-sm text-muted-foreground">{g.contact_name} · {g.email}{g.phone ? ` · ${g.phone}` : ""}</p>
              <p className="text-sm">{g.taping?.theme} · {g.taping && fmtShortDate(g.taping.starts_at)}</p>
              {g.notes && <p className="mt-1 text-sm text-muted-foreground">{g.notes}</p>}
            </div>
            {g.status === "pending" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="pill" onClick={() => decide(g.id, true)}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(g.id, false)}>Decline</Button>
              </div>
            ) : <span className="text-sm font-semibold capitalize">{g.status}</span>}
          </div>
        </li>
      ))}
      {data.length === 0 && <p className="text-muted-foreground">No group requests yet.</p>}
    </ul>
  );
}
