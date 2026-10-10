import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { q } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  const b = await req.json();
  await q("UPDATE project_notes SET title=COALESCE($2,title), body=COALESCE($3,body) WHERE id=$1", [Number((await params).id), b.title ?? null, b.body ?? null]);
  return NextResponse.json({ ok: true });
}
