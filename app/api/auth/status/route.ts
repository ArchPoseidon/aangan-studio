import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
export async function POST(req: Request) {
  const { name } = await req.json();
  const d = await q1<any>("SELECT pin_hash FROM designers WHERE name=$1", [name]);
  if (!d) return NextResponse.json({ error: "Unknown designer" }, { status: 404 });
  return NextResponse.json({ hasPin: !!d.pin_hash });
}
