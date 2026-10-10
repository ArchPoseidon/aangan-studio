import { NextResponse } from "next/server";
import { callHistory, callerPhone, formatTranscript, getTranscript } from "@/lib/vaani";
import { processCall } from "@/lib/pipeline";
import { q1 } from "@/lib/db";

// Polling fallback if the webhook is not registered: process any completed call in Vaani's history not yet seen.
export async function POST() {
  const agent = process.env.VAANI_AGENT_ID;
  const calls: any[] = ((await callHistory(1)).data ?? []).filter((c: any) => (!agent || c.agent_id === agent) && c.post_processing_status === "completed");
  const out: any[] = [];
  for (const c of calls) {
    if (await q1("SELECT 1 FROM calls WHERE vaani_call_id=$1", [c.call_id])) continue;
    try { out.push({ id: c.call_id, ...(await processCall({ vaaniCallId: c.call_id, transcript: formatTranscript(await getTranscript(c.call_id)), phone: callerPhone(c) })) }); }
    catch (e: any) { out.push({ id: c.call_id, error: e.message }); }
  }
  return NextResponse.json({ processed: out });
}
