import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Taping = Database["public"]["Tables"]["tapings"]["Row"];
export type Episode = Database["public"]["Tables"]["episodes"]["Row"];
export type Availability = {
  taping_id: string;
  seats_left: number;
  vip_left: number;
  waitlist_count: number;
};

export const upcomingTapingsQuery = queryOptions({
  queryKey: ["tapings", "upcoming"],
  queryFn: async () => {
    const [{ data: t, error }, { data: a }] = await Promise.all([
      supabase
        .from("tapings")
        .select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at"),
      supabase.rpc("taping_availability"),
    ]);
    if (error) throw error;
    const avail = new Map((a ?? []).map((x: Availability) => [x.taping_id, x]));
    return (t ?? []).map((tp) => ({
      ...tp,
      avail: avail.get(tp.id) ?? {
        taping_id: tp.id,
        seats_left: tp.capacity,
        vip_left: tp.vip_seats,
        waitlist_count: 0,
      },
    }));
  },
});
export type TapingWithAvail = Awaited<
  ReturnType<NonNullable<typeof upcomingTapingsQuery.queryFn>>
>[number];

export const episodesQuery = queryOptions({
  queryKey: ["episodes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .order("aired_on", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});
