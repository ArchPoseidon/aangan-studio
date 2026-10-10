import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q1 } from "./db";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret");
const COOKIE = "aangan_session";

export type Designer = { id: number; name: string };

export async function startSession(d: Designer) {
  const token = await new SignJWT({ id: d.id, name: d.name }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
}
export async function endSession() { (await cookies()).delete(COOKIE); }

export async function currentDesigner(): Promise<Designer | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    return await q1<Designer>("SELECT id, name FROM designers WHERE id=$1", [payload.id]);
  } catch { return null; }
}
export async function requireDesigner(): Promise<Designer> {
  const d = await currentDesigner();
  if (!d) redirect("/login");
  return d;
}
