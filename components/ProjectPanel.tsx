"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lightbulb, MapPin, Phone, Plus, X } from "lucide-react";
import type { Lead, Project } from "@/lib/data";
import { Avatar, Pill, Section, SidePanel, Transcript, useJson } from "./ui";
import { STAGES } from "@/lib/actions-shared";
import { ago, inr } from "@/lib/format";
import { materialChips, styleTags } from "@/lib/tags";

type Data = {
  project: Project; lead: Lead; notes: { id: number; title: string; body: string }[];
  updates: { id: number; detail: string; by: string | null; at: string }[]; gallery?: string[];
};

export function ProjectPanel({ projectId, onClose }: { projectId: number | null; onClose: () => void }) {
  const { data, loading, reload } = useJson<Data>(projectId ? `/api/project/${projectId}` : null);
  return (
    <SidePanel open={!!projectId} onClose={onClose} width={600}>
      {loading && !data && <div className="p-8 text-mute">Loading…</div>}
      {data?.project && <Body key={data.project.id} d={data} reload={reload} />}
    </SidePanel>
  );
}

function Body({ d, reload }: { d: Data; reload: () => void }) {
  const router = useRouter();
  const { project: p, lead: l } = d;
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [start, setStart] = useState(p.startDate ?? "");
  const [end, setEnd] = useState(p.endDate ?? "");
  const [saved, setSaved] = useState("");
  const moodboard = (d.gallery ?? []).slice(0, 5);

  async function patch(body: object) {
    await fetch(`/api/project/${p.id}`, { method: "PATCH", body: JSON.stringify(body) });
    setSaved("Saved"); setTimeout(() => setSaved(""), 1500); router.refresh(); reload();
  }
  async function addNote() { await fetch(`/api/project/${p.id}/notes`, { method: "POST" }); reload(); }
  async function saveNote(id: number, body: object) { await fetch(`/api/note/${id}`, { method: "PATCH", body: JSON.stringify(body) }); setSaved("Saved"); setTimeout(() => setSaved(""), 1500); }

  return (
    <div className="pb-10">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ivory">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-5 pt-16 text-ivory">
          <h2 className="font-serif text-[28px] leading-tight">{p.name}</h2>
          <div className="text-[13px] opacity-90">{[p.propertyType, p.location].filter(Boolean).join(" · ")}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line px-6 py-4">
        <Pill tone={p.stage}>{STAGES.find((s) => s.id === p.stage)?.short}</Pill>
        <span className="text-[16px] font-semibold text-olive">{inr(p.dealValue)}</span>
        {styleTags(p.preferences, p.kind).map((t) => <span key={t} className="pill bg-ivory text-ink/70">{t}</span>)}
        {materialChips(p.preferences).map((m) => <span key={m.name} className="pill bg-ivory text-ink/70"><i className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: m.color }} />{m.name}</span>)}
        <span className="ml-auto text-[12px] text-olive">{saved}</span>
      </div>

      <Section title="Stage & dates">
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label" htmlFor="st">Stage</label>
            <select id="st" className="field mt-1" value={p.stage} onChange={(e) => patch({ stage: e.target.value })}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.short}</option>)}</select></div>
          <div><label className="label" htmlFor="sd">Start date</label>
            <input id="sd" type="date" className="field mt-1" value={start} onChange={(e) => { setStart(e.target.value); patch({ startDate: e.target.value }); }} /></div>
          <div><label className="label" htmlFor="ed">End date</label>
            <input id="ed" type="date" className="field mt-1" value={end} onChange={(e) => { setEnd(e.target.value); patch({ endDate: e.target.value }); }} /></div>
        </div>
        <p className="mt-2 text-[12px] text-mute">Caller said: starts {l.startTimeline ?? "not stated"}; complete {l.completionTimeline ?? "not stated"}.</p>
      </Section>

      {moodboard.length > 0 && (
        <Section title="Moodboard" hint="click to enlarge">
          <div className="grid grid-cols-5 gap-2">
            {moodboard.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" onClick={() => setLightbox(src)} className="aspect-square cursor-zoom-in rounded-lg object-cover transition hover:opacity-85" />
            ))}
          </div>
        </Section>
      )}

      <Section title="Notes by call" hint="editable">
        <div className="space-y-3">
          {d.notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-line bg-ivory p-3">
              <input className="w-full bg-transparent text-[13px] font-semibold outline-none" defaultValue={n.title} onBlur={(e) => saveNote(n.id, { title: e.target.value })} />
              <textarea rows={3} className="mt-1 w-full resize-none bg-transparent text-[13px] outline-none" placeholder="Write the notes from this call…" defaultValue={n.body} onBlur={(e) => saveNote(n.id, { body: e.target.value })} />
            </div>
          ))}
          <button className="btn-ghost" onClick={addNote}><Plus size={14} />Add a call note</button>
        </div>
      </Section>

      <Section title="Client & owner">
        <div className="flex items-center gap-3 text-[13px]">
          <Avatar name={l.fullName} size={38} />
          <div><div className="font-semibold">{l.fullName}</div>
            <div className="flex gap-3 text-mute"><span className="inline-flex items-center gap-1"><Phone size={12} />{l.phone}</span>{l.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{l.location}</span>}</div></div>
          <div className="ml-auto text-right text-mute">Owner<div className="font-semibold text-ink">{p.designerName}</div></div>
        </div>
      </Section>

      <Section title="What the caller told us">
        <ul className="space-y-1.5 text-[13px]">{l.bullets.map((b, i) => <li key={i} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-olive" />{b}</li>)}</ul>
        {l.insights.length > 0 && <ul className="mt-3 space-y-1.5 text-[13px]">{l.insights.map((b, i) => <li key={i} className="flex gap-2"><Lightbulb size={14} className="mt-0.5 shrink-0 text-terracotta" />{b}</li>)}</ul>}
      </Section>

      <Section title="Activity">
        <ol className="relative ml-2 space-y-4 border-l border-line pl-5">
          {d.updates.map((u) => (
            <li key={u.id} className="relative text-[13px]"><span className="absolute -left-[26px] top-1 h-2 w-2 rounded-full border border-olive bg-ivory" />{u.detail}
              <div className="text-[11px] text-mute">{u.by ?? "System"} · {ago(u.at)}</div></li>
          ))}
        </ol>
      </Section>
      <Section title="Transcript"><Transcript text={l.transcript} /></Section>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-8 fade-enter" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl shadow-lift" />
          <button className="absolute right-6 top-6 rounded-full bg-ivory p-2" aria-label="Close"><X size={18} /></button>
        </div>
      )}
    </div>
  );
}
