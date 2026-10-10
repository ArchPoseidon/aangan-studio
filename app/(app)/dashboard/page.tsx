import { requireDesigner } from "@/lib/auth";
import { listDesigners, listLeads, listProjects } from "@/lib/data";
import { q } from "@/lib/db";
import { LeadsView } from "@/components/LeadsView";
import { MyProjects, TodoList, type TodoRow } from "@/components/DashboardBits";
import { inr } from "@/lib/format";

export default async function Dashboard() {
  const me = await requireDesigner();
  const [leads, projects, designers] = await Promise.all([listLeads(me.id), listProjects(me.id), listDesigners()]);
  const todos = (await q<any>(
    `SELECT t.id, t.lead_id, t.text, t.due_at, l.full_name FROM todos t JOIN leads l ON l.id=t.lead_id
     WHERE l.designer_id=$1 AND l.status <> 'complete' AND NOT t.done ORDER BY t.due_at NULLS LAST, t.id`, [me.id]
  )).map((t): TodoRow => ({ id: t.id, leadId: t.lead_id, lead: t.full_name, text: t.text, dueAt: t.due_at ? new Date(t.due_at).toISOString() : null }));
  const hr = new Date().getHours();
  const open = leads.filter((l) => l.status === "lead");
  const pipeline = projects.filter((p) => p.stage !== "completion").reduce((a, p) => a + (p.dealValue ?? 0), 0);
  const tiles = [
    { k: "Assigned leads", v: open.length }, { k: "Active projects", v: projects.filter((p) => p.stage !== "completion").length },
    { k: "Open to-dos", v: todos.length }, { k: "Pipeline value", v: inr(pipeline) },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-[32px]">Good {hr < 12 ? "morning" : hr < 17 ? "afternoon" : "evening"}, {me.name.split(" ")[0]}</h1>
      <p className="mb-6 mt-1 text-mute">Only your leads and projects appear here.</p>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => <div key={t.k} className="card px-5 py-4"><div className="text-[12px] text-mute">{t.k}</div><div className="mt-1 font-serif text-[30px] leading-none">{t.v}</div></div>)}
      </div>

      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.08em] text-mute">My to-dos</h2>
      <div className="mb-8"><TodoList todos={todos} designers={designers} /></div>

      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.08em] text-mute">My leads</h2>
      <div className="mb-8"><LeadsView leads={open} designers={designers} empty="No leads assigned to you yet. Pick yourself in the Leads tab." /></div>

      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.08em] text-mute">My projects</h2>
      {projects.length ? <MyProjects projects={projects} /> : <div className="card p-6 text-center text-[13px] text-mute">No projects yet.</div>}
    </div>
  );
}
