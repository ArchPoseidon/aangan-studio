import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { q } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  const id = Number((await params).id);
  const n = (await q<{ c: number }>("SELECT count(*)::int AS c FROM project_notes WHERE project_id=$1", [id]))[0].c;
  const r = await q("INSERT INTO project_notes (project_id, title, body) VALUES ($1,$2,'') RETURNING id", [id, `Call ${n + 1}`]);
  return NextResponse.json({ id: r[0].id });
}
