"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { Search } from "lucide-react";
import type { Project } from "@/lib/data";
import { STAGES } from "@/lib/actions-shared";
import { ProjectCard, type Density } from "./ProjectCard";
import { ProjectPanel } from "./ProjectPanel";
import { inr } from "@/lib/format";

function DraggableCard({ p, density, onOpen, dragging }: { p: Project; density: Density; onOpen: () => void; dragging: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: p.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} onClick={onOpen} className="cursor-grab touch-none active:cursor-grabbing fade-enter">
      <ProjectCard p={p} density={density} ghost={dragging} />
    </div>
  );
}

function Column({ id, label, count, total, children, over }: { id: string; label: string; count: number; total: number; children: React.ReactNode; over: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex min-w-[262px] flex-1 basis-0 flex-col rounded-2xl border p-2.5 transition-colors ${isOver || over ? "border-olive/40 bg-olive/5" : "border-line bg-ivory/50"}`}>
      <div className="mb-2.5 px-1.5 pt-1">
        <div className="flex items-center justify-between"><h3 className="text-[13px] font-semibold leading-tight">{label}</h3><span className="text-[12px] text-mute">{count}</span></div>
        <div className="mt-0.5 text-[12px] text-mute">{inr(total)}</div>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-3">{children}</div>
    </div>
  );
}

export function KanbanBoard({ projects, designers, meId }: { projects: Project[]; designers: { id: number; name: string }[]; meId: number }) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [density, setDensity] = useState<Density>("standard");
  const [search, setSearch] = useState("");
  const [designer, setDesigner] = useState("");
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  useEffect(() => setItems(projects), [projects]);

  const shown = items.filter((p) => (!designer || String(p.designerId) === designer) && (!search || `${p.name} ${p.client} ${p.location}`.toLowerCase().includes(search.toLowerCase())));
  const key = `${search}|${designer}|${density}`;

  function end(e: DragEndEvent) {
    setActive(null);
    const stage = e.over?.id as string | undefined;
    const id = Number(e.active.id);
    if (!stage || items.find((p) => p.id === id)?.stage === stage) return;
    setItems((cur) => cur.map((p) => (p.id === id ? { ...p, stage } : p)));
    fetch(`/api/project/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) }).then(() => router.refresh());
  }
  const dragged = items.find((p) => p.id === active);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input className="field !w-64 !pl-8" placeholder="Search projects, clients…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select aria-label="Filter by designer" className="field !w-52" value={designer} onChange={(e) => setDesigner(e.target.value)}>
          <option value="">All designers</option><option value={meId}>My projects</option>
          {designers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="ml-auto flex rounded-lg border border-line bg-ivory p-0.5 text-[13px]">
          {(["compact", "standard", "editorial"] as Density[]).map((d) => (
            <button key={d} onClick={() => setDensity(d)} className={`rounded-md px-3 py-1.5 font-medium capitalize transition ${density === d ? "bg-olive text-ivory" : "text-ink/70 hover:bg-limestone"}`}>{d}</button>
          ))}
        </div>
      </div>
      <DndContext sensors={sensors} onDragStart={(e: DragStartEvent) => setActive(Number(e.active.id))} onDragEnd={end} onDragCancel={() => setActive(null)}>
        <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-6">
          {STAGES.map((s) => {
            const col = shown.filter((p) => p.stage === s.id);
            return (
              <Column key={s.id} id={s.id} label={s.label} count={col.length} total={col.reduce((a, p) => a + (p.dealValue ?? 0), 0)} over={false}>
                {col.map((p) => <DraggableCard key={key + p.id} p={p} density={density} dragging={active === p.id} onOpen={() => setOpen(p.id)} />)}
                {!col.length && <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line py-8 text-[12px] text-mute">Drop a project here</div>}
              </Column>
            );
          })}
        </div>
        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(.2,1.3,.4,1)" }}>
          {dragged && <div className="w-[250px] scale-[1.02] rotate-[.6deg] rounded-2xl shadow-lift"><ProjectCard p={dragged} density={density} /></div>}
        </DragOverlay>
      </DndContext>
      <ProjectPanel projectId={open} onClose={() => setOpen(null)} />
    </>
  );
}
