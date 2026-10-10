"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { initials, tint } from "@/lib/format";

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink/70"
      style={{ width: size, height: size, background: tint(name), fontSize: size * 0.38 }}>{initials(name)}</span>
  );
}

const PILL: Record<string, string> = {
  unassigned: "bg-[#F2E4E1] text-[#8B4A3A]", assigned: "bg-[#E1EAF0] text-[#3C5A70]", project: "bg-[#E8DFF0] text-[#5B4472]",
  complete: "bg-[#DDE8D8] text-[#3C5A3C]", overdue: "bg-oxblood/10 text-oxblood", flag: "bg-[#F1E8CB] text-[#7A6420]",
  ideation: "bg-[#F1E8CB] text-[#7A6420]", procurement: "bg-[#E8DFF0] text-[#5B4472]", building: "bg-[#E1EAF0] text-[#3C5A70]", completion: "bg-[#DDE8D8] text-[#3C5A3C]",
  neutral: "bg-[#E8E5DE] text-[#5E574C]",
};
export const Pill = ({ tone = "neutral", children }: { tone?: string; children: React.ReactNode }) => (
  <span className={`pill ${PILL[tone] ?? PILL.neutral}`}>{children}</span>
);

export function SidePanel({ open, onClose, children, width = 580 }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 fade-enter" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/25" onClick={onClose} />
      <aside className="panel-enter absolute right-0 top-0 flex h-full max-w-full flex-col border-l border-line bg-limestone shadow-lift" style={{ width }}>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-full bg-ivory/90 p-1.5 text-mute shadow-card hover:text-ink"><X size={16} /></button>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}

export function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="px-6 py-4">
      <div className="mb-2 flex items-baseline justify-between"><h3 className="text-[12px] font-semibold uppercase tracking-[.08em] text-mute">{title}</h3>{hint && <span className="text-[12px] text-mute">{hint}</span>}</div>
      {children}
    </section>
  );
}

/** Renders "Speaker: text" lines as a transcript. */
export function Transcript({ text }: { text: string }) {
  const lines = text.split(/\n+/).filter(Boolean).map((l) => {
    const m = l.match(/^\s*(?:\[[\d:]+\]\s*)?([A-Za-z][\w .'-]{0,30}):\s*(.*)$/);
    return m ? { who: m[1], said: m[2] } : { who: "", said: l };
  });
  const first = lines[0]?.who;
  return (
    <div className="max-h-[340px] space-y-2.5 overflow-y-auto rounded-xl border border-line bg-ivory p-4">
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[72px_1fr] gap-3 text-[13px] leading-relaxed">
          <span className={`pt-[1px] text-[11px] font-semibold uppercase tracking-wide ${l.who === first ? "text-olive" : "text-terracotta"}`}>{l.who}</span>
          <span>{l.said}</span>
        </div>
      ))}
    </div>
  );
}

export function useJson<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) { setData(null); return; }
    let live = true; setLoading(true);
    fetch(url).then((r) => r.json()).then((d) => { if (live) { setData(d); setLoading(false); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);
  return { data, loading, reload: () => setTick((t) => t + 1), set: setData };
}
