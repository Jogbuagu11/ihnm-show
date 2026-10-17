import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  Clock,
  GitBranch,
  Tag,
  Bell,
  UserMinus,
  ClipboardList,
  Play,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pill } from "@/components/finance/crud";

type Journey = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  brand: "show" | "publishing";
  trigger_event: string;
  goal_event: string | null;
  enabled: boolean;
  allow_reentry: boolean;
};

type Step = {
  id: string;
  journey_id: string;
  position: number;
  type: string;
  config: Record<string, unknown>;
  next_step_id: string | null;
  alt_step_id: string | null;
};

type Stats = {
  journey_id: string;
  entered: number;
  active: number;
  completed: number;
  exited: number;
  sent: number;
  clicked: number;
};

const ICON: Record<string, typeof Mail> = {
  send_email: Mail,
  send_sms: MessageSquare,
  wait: Clock,
  condition: GitBranch,
  add_tag: Tag,
  remove_tag: Tag,
  start_journey: Play,
  admin_task: ClipboardList,
  notify_admin: Bell,
  unsubscribe: UserMinus,
};

/** Plain English for a step, so the graph is readable without opening the
 *  config. Deliberately not an editor: the step graph is data, and editing it
 *  by hand in a web form is how a live journey gets broken. */
function describe(s: Step): string {
  const c = s.config ?? {};
  const n = (k: string) => Number(c[k] ?? 0);
  switch (s.type) {
    case "send_email":
      return `Email: ${String(c["template"] ?? "?")}`;
    case "send_sms":
      return `Text: ${String(c["template"] ?? c["body"] ?? "?")}`;
    case "wait": {
      if (n("days_before_event"))
        return `Wait until ${n("days_before_event")} days before the date`;
      if (n("hours_before_event"))
        return `Wait until ${n("hours_before_event")} hours before the date`;
      if (c["until_event"]) return `Wait for ${String(c["until_event"])}`;
      const parts = [
        n("days") ? `${n("days")} day${n("days") === 1 ? "" : "s"}` : "",
        n("hours") ? `${n("hours")} hour${n("hours") === 1 ? "" : "s"}` : "",
        n("minutes") ? `${n("minutes")} min` : "",
      ].filter(Boolean);
      return `Wait ${parts.join(" ") || "no time"}`;
    }
    case "condition": {
      const kind = String(c["kind"] ?? "?");
      const what = String(c["event"] ?? c["tag"] ?? c["interest"] ?? "");
      const within = c["within_days"] ? ` within ${String(c["within_days"])} days` : "";
      const n = c["count"] ? ` at least ${String(c["count"])} times` : "";
      const phrase: Record<string, string> = {
        did_event: `they have done ${what}${n}${within}`,
        not_did_event: `they have not done ${what}${within}`,
        event_count_at_least: `they have done ${what}${n}`,
        has_tag: `they are tagged "${what}"`,
        has_interest: `they are interested in ${what}`,
      };
      return `If ${phrase[kind] ?? `${kind.replace(/_/g, " ")} ${what}`}`;
    }
    case "add_tag":
      return `Tag as "${String(c["tag"])}"`;
    case "remove_tag":
      return `Remove tag "${String(c["tag"])}"`;
    case "start_journey":
      return `Start journey: ${String(c["journey"])}`;
    case "admin_task":
      return `Task for staff: ${String(c["title"] ?? "")}`;
    case "notify_admin":
      return `Email staff: ${String(c["subject"] ?? "")}`;
    case "unsubscribe":
      return "Take them off the list";
    default:
      return s.type;
  }
}

export function JourneysAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);

  const { data: journeys = [] } = useQuery({
    queryKey: ["crew", "journeys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journeys")
        .select("*")
        .order("enabled", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as Journey[];
    },
  });

  const { data: steps = [] } = useQuery({
    queryKey: ["crew", "journey-steps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("journey_steps").select("*").order("position");
      if (error) throw error;
      return (data ?? []) as Step[];
    },
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["crew", "journey-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("journey_stats");
      if (error) throw error;
      return (data ?? []) as Stats[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["crew", "email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_templates").select("key");
      if (error) throw error;
      return (data ?? []).map((t) => t.key);
    },
  });

  const toggle = useMutation({
    mutationFn: async (j: Journey) => {
      const { error } = await supabase
        .from("journeys")
        .update({ enabled: !j.enabled })
        .eq("id", j.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crew", "journeys"] });
    },
    // The database refuses to enable a journey with unwritten templates; show
    // exactly which ones. A PostgrestError is a plain object, not an Error,
    // so instanceof is not enough to get at the message.
    onError: (e: unknown) => {
      const raw =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "";
      const missing = /missing email templates: (.+)$/.exec(raw);
      toast.error(
        missing ? `Write these templates first: ${missing[1]}` : raw || "Could not change that.",
      );
    },
  });

  const byJourney = (id: string) => steps.filter((s) => s.journey_id === id);
  const posOf = (id: string | null) =>
    id ? (steps.find((s) => s.id === id)?.position ?? null) : null;
  const statOf = (id: string) => stats.find((s) => s.journey_id === id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl">Journeys</h2>
        <p className="mt-1 text-sm text-ink/60">
          Automated email, run every five minutes. A journey can only be switched on once every
          email it sends has a written template. Marketing is capped at one email per person per day
          across all journeys, and every one carries an unsubscribe link.
        </p>
      </div>

      <ul className="space-y-3">
        {journeys.map((j) => {
          const js = byJourney(j.id);
          const st = statOf(j.id);
          const missing = js
            .filter((s) => s.type === "send_email")
            .map((s) => String(s.config?.["template"] ?? ""))
            .filter((k) => k && !templates.includes(k));
          const isOpen = open === j.id;
          return (
            <li key={j.id} className="rounded-xl bg-white">
              <div className="flex items-start gap-3 p-4">
                <button
                  className="mt-1 text-ink/50"
                  onClick={() => setOpen(isOpen ? null : j.id)}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{j.name}</p>
                    <Pill tone={j.brand === "publishing" ? "muted" : "good"}>
                      {j.brand === "publishing" ? "Publishing" : "Show"}
                    </Pill>
                    {missing.length > 0 && (
                      <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-xs font-semibold text-blush-foreground">
                        {missing.length} template{missing.length === 1 ? "" : "s"} to write
                      </span>
                    )}
                  </div>
                  {j.description && <p className="mt-1 text-sm text-ink/60">{j.description}</p>}
                  <p className="mt-1 font-mono text-xs text-ink/50">
                    on {j.trigger_event}
                    {j.goal_event ? ` · exits on ${j.goal_event}` : ""}
                    {j.allow_reentry ? " · can repeat" : ""}
                  </p>
                  {st && (st.entered > 0 || st.sent > 0) && (
                    <p className="mt-2 text-xs text-ink/60">
                      {st.entered} entered · {st.active} active · {st.completed} finished ·{" "}
                      {st.exited} exited early · {st.sent} sent · {st.clicked} clicked
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink/50">{j.enabled ? "On" : "Off"}</span>
                  <Switch
                    checked={j.enabled}
                    disabled={toggle.isPending}
                    onCheckedChange={() => toggle.mutate(j)}
                  />
                </div>
              </div>

              {isOpen && (
                <ol className="space-y-1 border-t border-ink/10 px-4 py-3">
                  {js.map((s, i) => {
                    const Icon = ICON[s.type] ?? Clock;
                    const yes = posOf(s.next_step_id);
                    const no = posOf(s.alt_step_id);
                    // Number by order shown, not by the stored position: a
                    // removed step leaves a gap that reads as a missing step.
                    const shown = (p: number | null) =>
                      p === null ? "end" : String(js.findIndex((x) => x.position === p) + 1);
                    return (
                      <li key={s.id} className="flex items-start gap-3 py-1 text-sm">
                        <span className="w-5 shrink-0 text-right font-mono text-xs text-ink/40">
                          {i + 1}
                        </span>
                        <Icon size={15} className="mt-0.5 shrink-0 text-ink/50" />
                        <span className="flex-1">
                          {describe(s)}
                          {s.type === "send_email" &&
                            missing.includes(String(s.config?.["template"] ?? "")) && (
                              <span className="ml-2 text-persimmon">needs copy</span>
                            )}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-ink/40">
                          {s.type === "condition"
                            ? `yes→${shown(yes)} no→${shown(no)}`
                            : `→${shown(yes)}`}
                        </span>
                      </li>
                    );
                  })}
                  {js.length === 0 && <li className="text-sm text-ink/50">No steps.</li>}
                </ol>
              )}
            </li>
          );
        })}
      </ul>

      <AdminTasks />
    </div>
  );
}

type Task = {
  id: string;
  title: string;
  detail: string | null;
  done_at: string | null;
  created_at: string;
  contact_id: string | null;
};

/** Steps that ask a person to do something land here. */
function AdminTasks() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery({
    queryKey: ["crew", "admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_tasks")
        .select("*")
        .is("done_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const finish = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_tasks")
        .update({ done_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["crew", "admin-tasks"] });
    },
    onError: () => toast.error("Could not mark that done."),
  });

  return (
    <div>
      <h3 className="font-display text-2xl">Tasks from journeys</h3>
      {tasks.length === 0 ? (
        <p className="mt-2 text-sm text-ink/60">Nothing waiting.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-4 rounded-xl bg-white p-4"
            >
              <div>
                <p className="font-medium">{t.title}</p>
                {t.detail && <p className="text-sm text-ink/60">{t.detail}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => finish.mutate(t.id)}>
                <span>Done</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
