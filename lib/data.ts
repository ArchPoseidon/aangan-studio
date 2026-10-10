import { q, q1 } from "./db";

export const d10 = (x: any): string | null => (x ? new Date(x).toISOString().slice(0, 10) : null);
const iso = (x: any): string | null => (x ? new Date(x).toISOString() : null);
const j = (x: any) => (typeof x === "string" ? JSON.parse(x) : x ?? []);

export type Lead = ReturnType<typeof shapeLead>;
function shapeLead(r: any) {
  return {
    id: r.id as number, phone: r.phone as string, fullName: r.full_name as string, surname: r.surname as string | null,
    location: r.property_location as string | null, propertyType: r.property_type as string | null, kind: r.property_kind as "flat" | "villa",
    preferences: r.key_preferences as string | null, startTimeline: r.start_timeline as string | null, completionTimeline: r.completion_timeline as string | null,
    meetingDate: d10(r.meeting_date), meetingAmPm: r.meeting_ampm as string | null,
    bullets: j(r.bullet_points) as string[], insights: j(r.insights) as string[], missing: j(r.missing_information) as string[], flags: j(r.flags) as string[],
    transcript: r.transcript as string, designerId: r.designer_id as number | null, designerName: (r.designer_name ?? null) as string | null,
    dealValue: r.deal_value == null ? null : Number(r.deal_value), note: (r.note ?? "") as string, status: r.status as "lead" | "project" | "complete",
    landedAt: iso(r.landed_at)!, fsError: (r.freshsales_error ?? null) as string | null, fsLeadId: r.freshsales_lead_id as string | null,
    fsDealId: r.freshsales_deal_id as string | null, fsWon: !!r.freshsales_won,
    projectId: (r.project_id ?? null) as number | null,
    overdue: Date.now() - new Date(r.landed_at).getTime() > 86400000 && (r.deal_value == null || !r.note?.trim()),
  };
}

const LEAD_SQL = `SELECT l.*, d.name AS designer_name, p.id AS project_id FROM leads l
  LEFT JOIN designers d ON d.id=l.designer_id LEFT JOIN projects p ON p.lead_id=l.id`;

export async function listLeads(designerId?: number) {
  const rows = await q(`${LEAD_SQL} ${designerId ? "WHERE l.designer_id=$1" : ""} ORDER BY l.landed_at DESC`, designerId ? [designerId] : []);
  return rows.map(shapeLead);
}
export async function getLead(id: number) { const r = await q1(`${LEAD_SQL} WHERE l.id=$1`, [id]); return r ? shapeLead(r) : null; }

export async function leadExtras(leadId: number) {
  const updates = await q("SELECT u.*, d.name AS by FROM lead_updates u LEFT JOIN designers d ON d.id=u.designer_id WHERE lead_id=$1 ORDER BY u.created_at ASC, u.id ASC", [leadId]);
  const todos = await q("SELECT * FROM todos WHERE lead_id=$1 ORDER BY id", [leadId]);
  return {
    updates: updates.map((u: any) => ({ id: u.id as number, kind: u.kind as string, detail: u.detail as string, by: u.by as string | null, at: iso(u.created_at)! })),
    todos: todos.map((t: any) => ({ id: t.id as number, kind: t.kind as string, text: t.text as string, dueAt: iso(t.due_at), done: t.done as boolean })),
  };
}

export async function listDesigners() { return q<{ id: number; name: string }>("SELECT id, name FROM designers ORDER BY name"); }

export type Project = Awaited<ReturnType<typeof listProjects>>[number];
export async function listProjects(designerId?: number) {
  const rows = await q(
    `SELECT p.*, l.full_name, l.surname, l.deal_value, l.property_type, l.property_location, l.property_kind, l.designer_id, l.key_preferences, l.note,
            l.completion_timeline, l.start_timeline, l.phone, d.name AS designer_name
     FROM projects p JOIN leads l ON l.id=p.lead_id LEFT JOIN designers d ON d.id=l.designer_id
     ${designerId ? "WHERE l.designer_id=$1" : ""} ORDER BY p.position, p.id`, designerId ? [designerId] : []);
  return rows.map((r: any) => ({
    id: r.id as number, leadId: r.lead_id as number, name: r.name as string, stage: r.stage as string, image: r.image as string,
    startDate: d10(r.start_date), endDate: d10(r.end_date), dealValue: r.deal_value == null ? null : Number(r.deal_value),
    designerId: r.designer_id as number | null, designerName: r.designer_name as string | null, client: r.full_name as string,
    propertyType: r.property_type as string | null, location: r.property_location as string | null, kind: r.property_kind as "flat" | "villa",
    preferences: r.key_preferences as string | null, note: (r.note ?? "") as string, startTimeline: r.start_timeline as string | null,
    completionTimeline: r.completion_timeline as string | null, phone: r.phone as string, createdAt: iso(r.created_at)!,
  }));
}
export async function projectNotes(projectId: number) {
  return (await q("SELECT * FROM project_notes WHERE project_id=$1 ORDER BY id", [projectId])).map((n: any) => ({ id: n.id as number, title: n.title as string, body: n.body as string }));
}

export async function notificationsFor(designerId: number) {
  const rows = await listLeads(designerId);
  return rows.filter((l) => l.overdue).map((l) => ({ leadId: l.id, text: `${l.fullName}: deal value and note are overdue (24h rule)` }));
}
