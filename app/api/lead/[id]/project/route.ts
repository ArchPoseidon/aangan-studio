import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/api";
import { makeProject } from "@/lib/actions";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  try { return NextResponse.json({ projectId: await makeProject(Number((await params).id)) }); }
  catch (e: any) { return bad(e.message); }
}
