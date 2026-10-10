"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Flag, Lightbulb, MapPin, Phone, HelpCircle } from "lucide-react";
import type { Lead } from "@/lib/data";
import { SidePanel, Section, Pill, Transcript, useJson, Avatar } from "./ui";
import { ago, meeting } from "@/lib/format";

type Extras = {
  lead: Lead;
  updates: { id: number; kind: string; detail: string; by: string | null; at: string }[];
  todos: { id: number; kind: string; text: string; dueAt: string | null; done: boolean }[];
};

export function LeadPanel({ leadId, designers, onClose }: { leadId: number | null; designers: { id: number; name: string }[]; onClose: () => void }) {
  const { data, loading, set } = useJson<Extras>(leadId ? `/api/lead/${leadId}` : null);
  return (
    <SidePanel open={!!leadId} onClose={onClose}>
      {loading && !data && <div className="p-8 text-mute">Loading…</div>}
      {data?.lead && <Body key={data.lead.id} data={data} designers={designers} apply={set} />}
    </SidePanel>
  );
}

function Body({ data, designers, apply }: { data: Extras; designers: { id: number; name: string }[]; apply: (d: Extras) => void }) {
  const router = useRouter();
  const l = data.lead;
  const [deal, setDeal] = useState(l.dealValue?.toString() ?? "");
  const [note, setNote] = useState(l.note);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { setDeal(l.dealValue?.toString() ?? ""); setNote(l.note); }, [l.dealValue, l.note]);

  async function patch(body: object) {
    setBusy(true); setErr("");
    const r = await fetch(`/api/lead/${l.id}`, { method: "PATCH", body: JSON.stringify(body) });
    setBusy(false);
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    apply(j); router.refresh();
  }
  async function toProject() {
    setBusy(true); setErr("");
    const r = await fetch(`/api/lead/${l.id}/project`, { method: "POST" });
    setBusy(false);
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    router.push("/projects");
  }
  async function tick(id: number, done: boolean) {
    apply({ ...data, todos: data.todos.map((t) => (t.id === id ? { ...t, done } : t)) });
    await fetch(`/api/todo/${id}`, { method: "PATCH", body: JSON.stringify({ done }) });
    router.refresh();
  }
  const dirty = deal !== (l.dealValue?.toString() ?? "") || note !== l.note;
  const missing = [!l.designerId && "a designer", (l.dealValue == null) && "a deal value", !l.note.trim() && "a note"].filter(Boolean);

  return (
    <div className="pb-10">
      <header className="border-b border-line px-6 pb-5 pt-6">
        <div className="flex items-center gap-3 pr-10">
          <Avatar name={l.fullName} size={44} />
          <div className="min-w-0">
            <h2 className="truncate font-serif text-[26px] leading-tight">{l.fullName}</h2>
            <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-mute">
              <span className="inline-flex items-center gap-1"><Phone size={12} />{l.phone}</span>
              {l.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{l.location}</span>}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill tone={l.status === "lead" ? (l.designerId ? "assigned" : "unassigned") : l.status}>{l.status === "lead" ? (l.designerId ? `Assigned · ${l.designerName}` : "Unassigned") : l.status === "project" ? "Project" : "Complete"}</Pill>
          <Pill><CalendarClock size={12} />{meeting(l.meetingDate, l.meetingAmPm)}</Pill>
          {l.overdue && <Pill tone="overdue"><Flag size={12} />Overdue: update within 24h</Pill>}
        </div>
      </header>

      <Section title="Designer & deal">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label" htmlFor="des">Designer</label>
            <select id="des" className="field mt-1" value={l.designerId ?? ""} disabled={busy} onChange={(e) => patch({ designerId: e.target.value || null })}>
              <option value="">Unassigned</option>
              {designers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="deal">Deal value (₹)</label>
            <input id="deal" inputMode="numeric" className="field mt-1" placeholder="e.g. 1800000" value={deal} onChange={(e) => setDeal(e.target.value.replace(/[^\d.]/g, ""))} />
          </div>
          <div className="flex items-end"><button className="btn-ghost w-full" disabled={busy || !dirty} onClick={() => patch({ dealValue: deal, note })}>Save</button></div>
          <div className="col-span-2">
            <label className="label" htmlFor="note">Note</label>
            <textarea id="note" rows={3} className="field mt-1 resize-none" placeholder="Next action, what the client wants…" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        {l.status === "lead" && (
          <div className="mt-3 flex items-center gap-3">
            <button className="btn-primary" disabled={busy || missing.length > 0 || dirty} onClick={toProject}>Make a project</button>
            {(missing.length > 0 || dirty) && <span className="text-[12px] text-mute">{dirty ? "Save your changes first" : `Needs ${missing.join(", ")}`}</span>}
          </div>
        )}
        {err && <p className="mt-2 text-[13px] text-oxblood">{err}</p>}
        <p className="mt-3 text-[12px] text-mute">
          {l.fsError ? <span className="text-oxblood">Freshsales sync issue: {l.fsError}</span> : l.fsLeadId ? <>Synced to Freshsales · contact {l.fsLeadId} · deal {l.fsDealId}{l.fsWon ? " · Closed Won" : ""}</> : "Not yet synced to Freshsales"}
        </p>
      </Section>

      {l.flags.length > 0 && (
        <Section title="Flags">
          <ul className="space-y-1.5">{l.flags.map((f, i) => <li key={i} className="flex gap-2 rounded-lg bg-[#F1E8CB]/60 px-3 py-2 text-[13px]"><Flag size={14} className="mt-0.5 shrink-0 text-[#7A6420]" />{f}</li>)}</ul>
        </Section>
      )}

      <Section title="To-dos">
        <ul className="space-y-1">
          {data.todos.map((t) => (
            <li key={t.id}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ivory">
                <input type="checkbox" className="mt-1 accent-[#354838]" checked={t.done} onChange={(e) => tick(t.id, e.target.checked)} />
                <span className={`text-[13px] ${t.done ? "text-mute line-through" : ""}`}>{t.text}
                  {t.dueAt && !t.done && <span className={`ml-2 text-[11px] ${new Date(t.dueAt) < new Date() ? "font-semibold text-oxblood" : "text-mute"}`}>due {new Date(t.dueAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="What the caller told us">
        <ul className="space-y-1.5 text-[13px]">{l.bullets.map((b, i) => <li key={i} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-olive" />{b}</li>)}</ul>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
          <div><dt className="label">Property</dt><dd>{l.propertyType ?? "—"}</dd></div>
          <div><dt className="label">Location</dt><dd>{l.location ?? "—"}</dd></div>
          <div><dt className="label">Start</dt><dd>{l.startTimeline ?? "—"}</dd></div>
          <div><dt className="label">Completion</dt><dd>{l.completionTimeline ?? "—"}</dd></div>
        </dl>
      </Section>

      {l.insights.length > 0 && (
        <Section title="Insights for the designer">
          <ul className="space-y-1.5 text-[13px]">{l.insights.map((b, i) => <li key={i} className="flex gap-2"><Lightbulb size={14} className="mt-0.5 shrink-0 text-terracotta" />{b}</li>)}</ul>
        </Section>
      )}
      {l.missing.length > 0 && (
        <Section title="Still to ask">
          <ul className="space-y-1.5 text-[13px]">{l.missing.map((b, i) => <li key={i} className="flex gap-2"><HelpCircle size={14} className="mt-0.5 shrink-0 text-mute" />{b}</li>)}</ul>
        </Section>
      )}

      <Section title="Updates">
        {data.updates.length === 0 ? <p className="text-[13px] text-mute">No updates yet.</p> : (
          <ol className="relative ml-2 space-y-4 border-l border-line pl-5">
            {data.updates.map((u) => (
              <li key={u.id} className="relative text-[13px]">
                <span className="absolute -left-[26px] top-1 h-2 w-2 rounded-full border border-olive bg-ivory" />
                <div>{u.detail}</div>
                <div className="text-[11px] text-mute">{u.by ?? "System"} · {ago(u.at)}</div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Transcript"><Transcript text={l.transcript} /></Section>
    </div>
  );
}
