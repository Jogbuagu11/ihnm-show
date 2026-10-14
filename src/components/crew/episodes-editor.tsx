import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { episodesQuery } from "@/lib/queries";
import { images, kindLabel } from "@/lib/show";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const blank = { title: "", kind: "episode" as "episode" | "sitdown" | "special", youtube_url: "", guests: "", tags: "", description: "", aired_on: new Date().toISOString().slice(0, 10), thumbnail: "studio", sponsor_name: "", sponsor_logo_url: "", sponsor_url: "" };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

export function EpisodesEditor() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(episodesQuery);
  const [f, setF] = useState(blank);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Title is required");
    const { error } = await supabase.from("episodes").insert({
      slug: `${slugify(f.title)}-${Date.now().toString(36).slice(-4)}`, title: f.title.trim(), kind: f.kind,
      youtube_url: f.youtube_url.trim() || null, description: f.description.trim() || null, aired_on: f.aired_on, thumbnail: f.thumbnail,
      sponsor_name: f.sponsor_name.trim() || null, sponsor_logo_url: f.sponsor_logo_url.trim() || null, sponsor_url: f.sponsor_url.trim() || null,
      guests: f.guests.split(",").map((x) => x.trim()).filter(Boolean), tags: f.tags.split(",").map((x) => x.trim()).filter(Boolean),
    });
    if (error) return toast.error(error.message);
    toast.success("Episode added");
    setF(blank);
    qc.invalidateQueries({ queryKey: ["episodes"] });
  }
  async function editSponsor(id: string, current: string | null) {
    const name = window.prompt("Sponsor name (leave empty to remove)", current ?? "");
    if (name === null) return;
    const logo = name.trim() ? window.prompt("Sponsor logo image URL (optional)", "") : "";
    const url = name.trim() ? window.prompt("Sponsor website (optional)", "") : "";
    const { error } = await supabase.from("episodes").update({ sponsor_name: name.trim() || null, sponsor_logo_url: logo?.trim() || null, sponsor_url: url?.trim() || null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Sponsor updated");
    qc.invalidateQueries({ queryKey: ["episodes"] });
  }
  async function remove(id: string) {
    await supabase.from("episodes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["episodes"] });
  }

  return (
    <div className="grid gap-6 py-4 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={save} className="space-y-3 rounded-3xl border bg-card p-5">
        <h3 className="text-xl font-semibold">Add episode</h3>
        <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={150} /></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><Label>Type</Label>
            <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v as typeof f.kind })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(kindLabel).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Aired</Label><Input type="date" value={f.aired_on} onChange={(e) => setF({ ...f, aired_on: e.target.value })} /></div>
          <div><Label>Thumbnail</Label>
            <Select value={f.thumbnail} onValueChange={(v) => setF({ ...f, thumbnail: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(images).map((k) => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>YouTube URL</Label><Input value={f.youtube_url} onChange={(e) => setF({ ...f, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Guests (comma separated)</Label><Input value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></div>
          <div><Label>Topic tags (comma separated)</Label><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></div>
        </div>
        <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} /></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><Label>Sponsor name</Label><Input value={f.sponsor_name} onChange={(e) => setF({ ...f, sponsor_name: e.target.value })} maxLength={100} /></div>
          <div><Label>Sponsor logo URL</Label><Input value={f.sponsor_logo_url} onChange={(e) => setF({ ...f, sponsor_logo_url: e.target.value })} /></div>
          <div><Label>Sponsor website</Label><Input value={f.sponsor_url} onChange={(e) => setF({ ...f, sponsor_url: e.target.value })} /></div>
        </div>
        <Button variant="gold">Add to catalogue</Button>
      </form>
      <ul className="space-y-2">
        {data.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-2xl bg-secondary p-3 text-sm">
            <span><span className="font-semibold">{e.title}</span><span className="block text-xs text-muted-foreground">{kindLabel[e.kind]} · {e.aired_on}</span></span>
            <span className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => editSponsor(e.id, e.sponsor_name)}>Sponsor</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(e.id)}>Remove</Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
