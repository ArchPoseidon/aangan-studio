import { requireDesigner } from "@/lib/auth";
import { listDesigners, listProjects } from "@/lib/data";
import { KanbanBoard } from "@/components/KanbanBoard";

export default async function Projects() {
  const me = await requireDesigner();
  const [projects, designers] = await Promise.all([listProjects(), listDesigners()]);
  return (
    <div>
      <h1 className="font-serif text-[30px]">Projects</h1>
      <p className="mb-6 mt-1 text-mute">Drag a card to move it between stages. Open a card for notes, dates and the full brief.</p>
      {projects.length ? <KanbanBoard projects={projects} designers={designers} meId={me.id} />
        : <div className="card p-10 text-center text-mute">No projects yet. Make a project from a lead once it has a designer, deal value and a note.</div>}
    </div>
  );
}
