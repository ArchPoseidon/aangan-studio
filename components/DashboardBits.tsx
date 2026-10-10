"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/data";
import { ProjectCard } from "./ProjectCard";
import { ProjectPanel } from "./ProjectPanel";
import { LeadPanel } from "./LeadPanel";

export type TodoRow = { id: number; leadId: number; lead: string; text: string; dueAt: string | null };

export function TodoList({ todos, designers }: { todos: TodoRow[]; designers: { id: number; name: string }[] }) {
  const router = useRouter();
  const [gone, setGone] = useState<number[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const rows = todos.filter((t) => !gone.includes(t.id));
  async function done(id: number) {
    setGone((g) => [...g, id]);
    await fetch(`/api/todo/${id}`, { method: "PATCH", body: JSON.stringify({ done: true }) });
    router.refresh();
  }
  if (!rows.length) return <div className="card p-6 text-center text-[13px] text-mute">Nothing to do right now.</div>;
  return (
    <>
      <ul className="card divide-y divide-line">
        {rows.map((t) => {
          const late = t.dueAt && new Date(t.dueAt) < new Date();
          return (
            <li key={t.id} className="flex items-start gap-3 px-4 py-3">
              <input type="checkbox" aria-label="Mark done" className="mt-1 accent-[#354838]" onChange={() => done(t.id)} />
              <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(t.leadId)}>
                <div className="text-[13px]">{t.text}</div>
                <div className="text-[12px] text-mute">{t.lead}{t.dueAt && <span className={late ? "ml-2 font-semibold text-oxblood" : "ml-2"}>{late ? "overdue" : "due"} {new Date(t.dueAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}</div>
              </button>
            </li>
          );
        })}
      </ul>
      <LeadPanel leadId={open} designers={designers} onClose={() => setOpen(null)} />
    </>
  );
}

export function MyProjects({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => <div key={p.id} className="cursor-pointer" onClick={() => setOpen(p.id)}><ProjectCard p={p} density="standard" /></div>)}
      </div>
      <ProjectPanel projectId={open} onClose={() => setOpen(null)} />
    </>
  );
}
