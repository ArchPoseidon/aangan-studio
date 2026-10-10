import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { listProjects, projectNotes, getLead, leadExtras } from "@/lib/data";
import { moveProject, STAGES } from "@/lib/actions";
import { coverSet } from "@/lib/images";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  const id = Number((await params).id);
  const project = (await listProjects()).find((p) => p.id === id);
  if (!project) return bad("Not found", 404);
  const lead = await getLead(project.leadId);
  return NextResponse.json({ project, lead, notes: await projectNotes(id), updates: (await leadExtras(project.leadId)).updates,
    gallery: [project.image, ...coverSet(project.kind).filter((x) => x !== project.image)].slice(0, 5) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  const id = Number((await params).id);
  const b = await req.json();
  if (!(await q1("SELECT 1 FROM projects WHERE id=$1", [id]))) return bad("Not found", 404);
  if ("startDate" in b) await q("UPDATE projects SET start_date=$2 WHERE id=$1", [id, b.startDate || null]);
  if ("endDate" in b) await q("UPDATE projects SET end_date=$2 WHERE id=$1", [id, b.endDate || null]);
  if (b.stage) {
    if (!STAGES.some((s) => s.id === b.stage)) return bad("Unknown stage");
    await moveProject(id, b.stage);
  }
  return NextResponse.json({ ok: true });
}
