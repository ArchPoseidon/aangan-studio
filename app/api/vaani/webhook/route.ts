import { NextResponse } from "next/server";
import { callHistory, callerPhone, formatTranscript, getTranscript } from "@/lib/vaani";
import { processCall } from "@/lib/pipeline";

// Register this URL in Vaani: Settings -> Webhooks. Only `call_postprocessing` (transcript ready) starts the pipeline; other events get a 200.
// If WEBHOOK_SECRET is set, send it as ?secret=... on the registered URL (Vaani's dashboard has no custom-header field documented).
export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && new URL(req.url).searchParams.get("secret") !== secret) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (b.event !== "call_postprocessing") return NextResponse.json({ ok: true, ignored: b.event ?? null });
  const d = b.data ?? b;
  const callId = String(d.call_id ?? b.call_id ?? "");
  if (!callId) return NextResponse.json({ error: "no call_id" }, { status: 400 });
  const transcript = formatTranscript(d.transcript ?? (await getTranscript(callId)));

  let phone: string | null = d.entities?.phone ?? null;
  try {
    const row = ((await callHistory(1)).data ?? []).find((c: any) => c.call_id === callId);
    phone = callerPhone(row) ?? phone;
  } catch { /* phone then falls back to what Gemini heard, or is flagged on the lead */ }

  return NextResponse.json(await processCall({ vaaniCallId: callId, transcript, phone }));
}
