import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill } from "@/components/finance/crud";

export function StaffAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["staff"], queryFn: async () => {
    const { data, error } = await supabase.rpc("list_staff");
    if (error) throw error;
    return data ?? [];
  } });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"crew" | "admin">("crew");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { data: res, error } = await supabase.rpc("add_staff", { _email: email, _role: role });
    if (error) return toast.error(error.message);
    toast.success(res === "added" ? `${email} now has ${role} access` : `Invite saved — ${email} gets ${role} access when they sign up`);
    setEmail("");
    qc.invalidateQueries({ queryKey: ["staff"] });
  }
  async function remove(userId: string | null, mail: string) {
    const { error } = await supabase.rpc("remove_staff", { _user: userId as string, _email: mail });
    if (error) return toast.error(error.message);
    toast.success("Access removed");
    qc.invalidateQueries({ queryKey: ["staff"] });
  }

  return (
    <div className="mt-4 space-y-6">
      <form onSubmit={add} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 sm:flex-row">
        <Input type="email" required placeholder="Their email address" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <Select value={role} onValueChange={(v) => setRole(v as "crew" | "admin")}>
          <SelectTrigger className="sm:w-40" aria-label="Role"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="crew">Crew</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
        </Select>
        <Button type="submit" variant="gold">Add to team</Button>
      </form>
      <p className="text-sm text-muted-foreground">Crew can run check-in, shuttle, groups and submissions. Admins also see Finance, Guest Hub, Inbox and this Team tab. If they don't have an account yet, they get access the moment they sign up with this email.</p>
      <ul className="divide-y rounded-2xl border bg-card">
        {data.map((s) => (
          <li key={`${s.email}-${s.role}`} className="flex items-center justify-between gap-3 p-4">
            <span className="text-sm"><span className="font-semibold">{s.email}</span> <Pill tone={s.role === "admin" ? "warn" : "muted"}>{s.role}</Pill>{s.pending && <Pill>invited</Pill>}</span>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(s.user_id, s.email)}>Remove</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
