import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fmtShortDate } from "@/lib/show";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dashboard } from "@/components/crew/dashboard";
import { CheckIn } from "@/components/crew/check-in";
import { ShuttleManifest } from "@/components/crew/shuttle-manifest";
import { GroupRequests } from "@/components/crew/group-requests";
import { SubmissionsQueue } from "@/components/crew/submissions";
import { TapingsEditor } from "@/components/crew/tapings-editor";
import { EpisodesEditor } from "@/components/crew/episodes-editor";
import { Releases } from "@/components/crew/releases";
import { Analytics } from "@/components/crew/analytics";
import { VolunteersAdmin } from "@/components/crew/volunteers";
import { Messages } from "@/components/crew/messages";
import { GuestHub } from "@/components/crew/guest-hub";
import { Inbox } from "@/components/crew/inbox";
import { StaffAdmin } from "@/components/crew/staff";
import { DoorSign } from "@/components/crew/door-sign";
import { FeedbackList } from "@/components/crew/feedback";
import { PrayerInbox } from "@/components/crew/prayer";

export const Route = createFileRoute("/_authenticated/crew")({
  head: () => ({
    meta: [
      { title: "Crew Portal — IHNM Show" },
      { name: "description", content: "Crew and admin tools for IHNM Show tapings." },
      { property: "og:title", content: "Crew Portal — IHNM Show" },
      { property: "og:description", content: "Crew tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Crew,
});

export const allTapingsKey = ["crew", "tapings"];

function Crew() {
  const { isStaff, roles } = useAuth();
  const { data: tapings = [] } = useQuery({
    queryKey: allTapingsKey,
    enabled: isStaff,
    queryFn: async () => (await supabase.from("tapings").select("*").order("starts_at")).data ?? [],
  });
  const [tid, setTid] = useState<string>("");
  useEffect(() => {
    if (!tid && tapings.length) {
      const upcoming = tapings.find((t) => new Date(t.starts_at) > new Date(Date.now() - 6 * 3600e3));
      setTid((upcoming ?? tapings[tapings.length - 1])?.id ?? "");
    }
  }, [tapings, tid]);

  if (!isStaff) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="text-3xl font-semibold">Crew only</h1><p className="mt-2 text-muted-foreground">Your account doesn't have crew access. Ask an admin to add you.</p></div>;
  }
  const taping = tapings.find((t) => t.id === tid);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{roles.includes("admin") ? "Admin" : "Crew"}</p>
          <h1 className="text-4xl font-semibold">Crew Portal</h1>
        </div>
        <Select value={tid} onValueChange={setTid}>
          <SelectTrigger className="sm:w-80"><SelectValue placeholder="Choose a taping" /></SelectTrigger>
          <SelectContent>
            {tapings.map((t) => <SelectItem key={t.id} value={t.id}>{fmtShortDate(t.starts_at)} — {t.theme}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="checkin">Check-in</TabsTrigger>
          <TabsTrigger value="shuttle">Shuttle</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="tapings">Tapings</TabsTrigger>
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="door">Door QR</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="prayer">Prayer</TabsTrigger>
          {roles.includes("admin") && <TabsTrigger value="guests">Guest Hub</TabsTrigger>}
          {roles.includes("admin") && <TabsTrigger value="inbox">Inbox</TabsTrigger>}
          {roles.includes("admin") && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          {roles.includes("admin") && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>
        <TabsContent value="dashboard">{taping && <Dashboard taping={taping} />}</TabsContent>
        <TabsContent value="checkin">{taping && <CheckIn taping={taping} />}</TabsContent>
        <TabsContent value="shuttle">{taping && <ShuttleManifest taping={taping} />}</TabsContent>
        <TabsContent value="releases">{taping && <Releases taping={taping} />}</TabsContent>
        <TabsContent value="groups"><GroupRequests /></TabsContent>
        <TabsContent value="submissions"><SubmissionsQueue tapings={tapings} /></TabsContent>
        <TabsContent value="tapings"><TapingsEditor tapings={tapings} /></TabsContent>
        <TabsContent value="episodes"><EpisodesEditor /></TabsContent>
        <TabsContent value="volunteers">{taping && <VolunteersAdmin taping={taping} tapings={tapings} isAdmin={roles.includes("admin")} />}</TabsContent>
        <TabsContent value="messages">{taping && <Messages taping={taping} />}</TabsContent>
        <TabsContent value="door">{taping && <DoorSign taping={taping} />}</TabsContent>
        <TabsContent value="feedback">{taping && <FeedbackList taping={taping} />}</TabsContent>
        <TabsContent value="prayer"><PrayerInbox /></TabsContent>
        {roles.includes("admin") && <TabsContent value="guests">{taping && <GuestHub taping={taping} tapings={tapings} />}</TabsContent>}
        {roles.includes("admin") && <TabsContent value="inbox"><Inbox /></TabsContent>}
        {roles.includes("admin") && <TabsContent value="analytics"><Analytics /></TabsContent>}
        {roles.includes("admin") && <TabsContent value="team"><StaffAdmin /></TabsContent>}
      </Tabs>
    </div>
  );
}
