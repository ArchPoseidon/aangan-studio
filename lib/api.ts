import { NextResponse } from "next/server";
import { currentDesigner } from "./auth";

export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
export async function guard() {
  const d = await currentDesigner();
  return d ? { d } : { err: bad("Not signed in", 401) };
}
