import { q, q1 } from "./db";
import { pickCover } from "./images";
import { syncLead, syncNote } from "./pipeline";
import { closeWon } from "./freshsales";

export const STAGES = [
  { id: "ideation", label: "Ideation stage" },
  { id: "procurement", label: "Procurement stage and procurement calls" },
  { id: "building", label: "Client building stage" },
  { id: "completion", label: "Completion" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

export async function assignLead(leadId: number, designerId: number | null, by: number) {
  await q("UPDATE leads SET designer_id=$2 WHERE id=$1", [leadId, designerId]);
  const d = designerId ? await q1<any>("SELECT name FROM designers WHERE id=$1", [designerId]) : null;
  await q("INSERT INTO lead_updates (lead_id, designer_id, kind, detail) VALUES ($1,$2,'assign',$3)", [leadId, by, d ? `Assigned to ${d.name}` : "Unassigned"]);
  await syncLead(leadId);
}

export async function updateLead(leadId: number, by: number, patch: { deal_value?: number | null; note?: string }) {
  const cur = await q1<any>("SELECT deal_value, note FROM leads WHERE id=$1", [leadId]);
  const me = await q1<any>("SELECT name FROM designers WHERE id=$1", [by]);
  if (patch.deal_value !== undefined && Number(cur.deal_value ?? NaN) !== patch.deal_value) {
    await q("UPDATE leads SET deal_value=$2 WHERE id=$1", [leadId, patch.deal_value]);
    await q("UPDATE todos SET done=true WHERE lead_id=$1 AND kind='deal_value'", [leadId]);
    await q("INSERT INTO lead_updates (lead_id, designer_id, kind, detail) VALUES ($1,$2,'deal_value',$3)",
      [leadId, by, `Deal value set to ₹${Number(patch.deal_value).toLocaleString("en-IN")}`]);
    await syncLead(leadId);
  }
  if (patch.note !== undefined && patch.note.trim() && patch.note !== cur.note) {
    await q("UPDATE leads SET note=$2 WHERE id=$1", [leadId, patch.note]);
    await q("UPDATE todos SET done=true WHERE lead_id=$1 AND kind='note'", [leadId]);
    await q("INSERT INTO lead_updates (lead_id, designer_id, kind, detail) VALUES ($1,$2,'note',$3)", [leadId, by, patch.note]);
    await syncNote(leadId, patch.note, me.name);
  }
}

export async function makeProject(leadId: number) {
  const l = await q1<any>("SELECT * FROM leads WHERE id=$1", [leadId]);
  if (!l) throw new Error("Lead not found");
  if (!l.designer_id || l.deal_value == null || !l.note?.trim()) throw new Error("Assign a designer and fill in deal value and a note first");
  if (await q1("SELECT 1 FROM projects WHERE lead_id=$1", [leadId])) throw new Error("Already a project");
  const p = (await q<{ id: number }>(
    "INSERT INTO projects (lead_id, name, image) VALUES ($1,$2,$3) RETURNING id",
    [leadId, `${l.surname ?? l.full_name} Residence`, pickCover(l.property_kind, l.id)]))[0];
  await q("INSERT INTO project_notes (project_id, title, body) VALUES ($1,'Call 1 · Discovery call',$2)", [p.id, l.note]);
  await q("UPDATE leads SET status='project' WHERE id=$1", [leadId]);
  return p.id;
}

export async function moveProject(projectId: number, stage: StageId) {
  await q("UPDATE projects SET stage=$2, completed_at=CASE WHEN $2='completion' THEN now() ELSE NULL END WHERE id=$1", [projectId, stage]);
  const p = await q1<any>("SELECT p.name, p.lead_id, l.deal_value, l.freshsales_deal_id, l.freshsales_won, l.status FROM projects p JOIN leads l ON l.id=p.lead_id WHERE p.id=$1", [projectId]);
  if (stage === "completion") {
    await q("UPDATE leads SET status='complete' WHERE id=$1", [p.lead_id]);
    if (!p.freshsales_won) {
      try {
        if (!p.freshsales_deal_id) await syncLead(p.lead_id);
        const fresh = await q1<any>("SELECT freshsales_deal_id FROM leads WHERE id=$1", [p.lead_id]);
        if (!fresh?.freshsales_deal_id) throw new Error("No Freshsales deal to close");
        await closeWon(fresh.freshsales_deal_id, p.name, Number(p.deal_value ?? 0));
        await q("UPDATE leads SET freshsales_won=true, freshsales_error=NULL WHERE id=$1", [p.lead_id]);
      } catch (e: any) {
        await q("UPDATE leads SET freshsales_error=$2 WHERE id=$1", [p.lead_id, String(e.message ?? e)]);
      }
    }
  } else if (p.status === "complete") {
    await q("UPDATE leads SET status='project' WHERE id=$1", [p.lead_id]); // moved back out of Completion; Freshsales deal stays Won (see QUESTIONS.md)
  }
}
