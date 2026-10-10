"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LeadPanel } from "./LeadPanel";
import { ProjectPanel } from "./ProjectPanel";

export type CalEvent = { date: string; kind: "meeting" | "start" | "due"; label: string; sub: string; leadId?: number; projectId?: number };
const COLOR = { meeting: "bg-terracotta/15 text-[#8B4A3A]", start: "bg-olive/15 text-olive", due: "bg-oxblood/10 text-oxblood" };
const NAME = { meeting: "Meeting", start: "Project start", due: "Project due" };

export function CalendarView({ events, designers }: { events: CalEvent[]; designers: { id: number; name: string }[] }) {
  const [cur, setCur] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [lead, setLead] = useState<number | null>(null);
  const [project, setProject] = useState<number | null>(null);
  const cells = useMemo(() => {
    const first = (cur.getDay() + 6) % 7; // Monday-first
    const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => {
      const day = i - first + 1;
      return day < 1 || day > days ? null : new Date(cur.getFullYear(), cur.getMonth(), day);
    });
  }, [cur]);
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayKey = key(new Date());
  const upcoming = events.filter((e) => e.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  const click = (e: CalEvent) => (e.projectId ? setProject(e.projectId) : e.leadId && setLead(e.leadId));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[22px]">{cur.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
          <div className="flex gap-1">
            <button aria-label="Previous month" className="btn-ghost !px-2" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
            <button className="btn-ghost" onClick={() => { const n = new Date(); setCur(new Date(n.getFullYear(), n.getMonth(), 1)); }}>Today</button>
            <button aria-label="Next month" className="btn-ghost !px-2" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line text-[12px]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-limestone px-2 py-1.5 font-semibold text-mute">{d}</div>)}
          {cells.map((d, i) => (
            <div key={i} className={`min-h-[96px] bg-ivory p-1.5 ${d && key(d) === todayKey ? "ring-2 ring-inset ring-olive/40" : ""}`}>
              {d && <div className="mb-1 text-mute">{d.getDate()}</div>}
              {d && events.filter((e) => e.date === key(d)).map((e, j) => (
                <button key={j} onClick={() => click(e)} className={`mb-1 block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium ${COLOR[e.kind]}`} title={`${NAME[e.kind]}: ${e.label}`}>{e.sub} {e.label}</button>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-[12px] text-mute">
          {(["meeting", "start", "due"] as const).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-sm ${COLOR[k].split(" ")[0]}`} />{NAME[k]}</span>)}
        </div>
      </div>
      <div className="card h-fit p-4">
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[.08em] text-mute">Coming up</h3>
        {upcoming.length ? upcoming.map((e, i) => (
          <button key={i} onClick={() => click(e)} className="block w-full border-t border-line py-2.5 text-left first:border-0 hover:bg-limestone/50">
            <div className="text-[13px] font-semibold">{e.label}</div>
            <div className="text-[12px] text-mute">{NAME[e.kind]} · {new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} {e.sub}</div>
          </button>
        )) : <p className="text-[13px] text-mute">Nothing scheduled.</p>}
      </div>
      <LeadPanel leadId={lead} designers={designers} onClose={() => setLead(null)} />
      <ProjectPanel projectId={project} onClose={() => setProject(null)} />
    </div>
  );
}
