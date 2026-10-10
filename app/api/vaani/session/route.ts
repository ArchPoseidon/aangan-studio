import { NextResponse } from "next/server";
import { guard, bad } from "@/lib/api";
import { createSession } from "@/lib/vaani";

// Starts a WebRTC test call with the Aangan agent. Returns Vaani's shareable session URL.
export async function POST(req: Request) {
  const g = await guard(); if (g.err) return g.err;
  const agent = process.env.VAANI_AGENT_ID;
  if (!agent) return bad("VAANI_AGENT_ID is not set. Create the agent in Vaani using agent/system_prompt.md first.");
  const { phone } = await req.json().catch(() => ({}));
  try { return NextResponse.json(await createSession(agent, { phone: phone ?? null, source: "dashboard-test" })); }
  catch (e: any) { return bad(e.message, 502); }
}
