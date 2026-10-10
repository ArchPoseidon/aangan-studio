import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/api";
import { getLead, leadExtras } from "@/lib/data";
import { assignLead, updateLead } from "@/lib/actions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  const id = Number((await params).id);
  const lead = await getLead(id);
  if (!lead) return bad("Not found", 404);
  return NextResponse.json({ lead, ...(await leadExtras(id)) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.err) return g.err;
  const id = Number((await params).id);
  const b = await req.json();
  if ("designerId" in b) await assignLead(id, b.designerId ? Number(b.designerId) : null, g.d.id);
  if ("dealValue" in b || "note" in b) {
    const dv = b.dealValue === "" || b.dealValue == null ? undefined : Number(b.dealValue);
    if (dv !== undefined && (!Number.isFinite(dv) || dv < 0)) return bad("Deal value must be a positive number");
    await updateLead(id, g.d.id, { deal_value: dv, note: b.note });
  }
  return NextResponse.json({ lead: await getLead(id), ...(await leadExtras(id)) });
}
