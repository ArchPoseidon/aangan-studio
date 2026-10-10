import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { q, q1 } from "@/lib/db";
import { startSession } from "@/lib/auth";
import { bad } from "@/lib/api";

export async function POST(req: Request) {
  const { name, pin } = await req.json();
  if (!/^\d{4,8}$/.test(String(pin ?? ""))) return bad("PIN must be 4 to 8 digits");
  const d = await q1<any>("SELECT id, name, pin_hash FROM designers WHERE name=$1", [name]);
  if (!d) return bad("Unknown designer", 404);
  if (!d.pin_hash) {
    await q("UPDATE designers SET pin_hash=$2 WHERE id=$1", [d.id, await bcrypt.hash(String(pin), 10)]); // first login: this PIN becomes theirs
  } else if (!(await bcrypt.compare(String(pin), d.pin_hash))) return bad("Incorrect PIN", 401);
  await startSession({ id: d.id, name: d.name });
  return NextResponse.json({ ok: true, created: !d.pin_hash });
}
