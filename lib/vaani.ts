// Vaani API (docs: https://docs.vaanivoice.ai). Auth: X-API-Key. Post-call data arrives by webhook (`call_postprocessing`);
// the transcript and call-history endpoints below are the polling fallback.
const BASE = () => process.env.VAANI_BASE_URL ?? "https://api.vaanivoice.ai";

async function vaani(method: string, path: string, body?: unknown) {
  const key = process.env.VAANI_API_KEY;
  if (!key) throw new Error("VAANI_API_KEY missing");
  const r = await fetch(BASE() + path, {
    method, headers: { "X-API-Key": key, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Vaani ${method} ${path} -> ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

export const listAgents = () => vaani("GET", "/api/agents");
export const createAgent = (name: string, config: object) => vaani("POST", "/api/create-agent", { agent_display_name: name, config });
export const patchPersona = (agentId: string, body: object) => vaani("PATCH", `/api/agent/${agentId}/persona`, body);
/** Shareable in-browser (WebRTC) session; the returned session_url can be opened to talk to the agent. */
export const createSession = (agentId: string, metadata: Record<string, unknown> = {}) =>
  vaani("POST", "/api/webrtc/session/create", { agent_id: agentId, ui_type: "widget", grace_period: 60, session_ttl: 1800, metadata });
export const getTranscript = (callId: string) => vaani("GET", `/api/transcript/${callId}`);
export const callHistory = (page = 1) => vaani("GET", `/api/call-history?page=${page}&page_size=50`);

/** "[13:33:14] AGENT: hi\n\n[13:33:19] USER: yes" -> "AGENT: hi\nUSER: yes" */
export function formatTranscript(t: any): string {
  const raw = typeof t === "string" ? t : t?.transcript;
  if (typeof raw !== "string") return JSON.stringify(t);
  return raw.split(/\n+/).map((l) => l.replace(/^\s*\[[\d:]+\]\s*/, "").trim()).filter(Boolean).join("\n");
}

/** The caller's number: for inbound telephony it is from_number; WebRTC tests carry it in metadata. */
export function callerPhone(c: any): string | null {
  const meta = c?.call_metadata ?? {};
  if (meta.phone) return String(meta.phone);
  const inbound = /in/i.test(String(c?.direction ?? c?.call_type ?? ""));
  return (inbound ? c?.from_number : c?.to_number) ?? null;
}
