import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { q } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  const { done } = await req.json();
  await q("UPDATE todos SET done=$2 WHERE id=$1", [Number((await params).id), !!done]);
  return NextResponse.json({ ok: true });
}
