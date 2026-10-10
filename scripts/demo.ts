// End-to-end demo path without a live call. Prints PASS/FAIL per step. Touches Freshsales for real (sample data only).
import { q, q1 } from "../lib/db";
import { DESIGNERS, SAMPLES } from "../db/sample-transcripts";
import { processCall } from "../lib/pipeline";
import { assignLead, updateLead, makeProject, moveProject } from "../lib/actions";
import { listLeads, listProjects, getLead } from "../lib/data";

const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, info = "") => { results.push([name, ok, info]); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`); };

async function main() {
  for (const n of DESIGNERS) await q("INSERT INTO designers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [n]);
  check("14 designers seeded", (await q("SELECT 1 FROM designers")).length === 14);

  const out: any[] = [];
  for (const s of SAMPLES) out.push(await processCall({ vaaniCallId: s.id, transcript: s.transcript, phone: s.phone, source: "sample" }));
  check("Mehta call qualified", out[0].qualified === true);
  check("Kapoor call qualified (pricing flag expected)", out[1].qualified === true);
  check("Vendor call not qualified, no lead created", out[2].qualified === false && !(await q1("SELECT 1 FROM leads WHERE phone='+919800000103' OR phone='919800000103'")));

  const lead = (await listLeads()).find((l) => l.surname === "Mehta")!;
  check("Gemini extracted surname + meeting slot", lead?.surname === "Mehta" && !!lead.meetingDate && !!lead.meetingAmPm, `${lead?.meetingDate} ${lead?.meetingAmPm}`);
  check("Lead has bullets, insights, todos", lead.bullets.length > 2 && (await q("SELECT 1 FROM todos WHERE lead_id=$1", [lead.id])).length >= 3);
  check("Lead pushed to Freshsales", !!(await getLead(lead.id))?.fsLeadId, (await getLead(lead.id))?.fsError ?? "");
  const kap = (await listLeads()).find((l) => l.surname === "Kapoor")!;
  check("Pricing pressed -> flag raised", kap.flags.some((f) => /pric|cost|budget|per.?sq/i.test(f)), kap.flags.join(" | "));

  const [a, b] = await q<any>("SELECT id, name FROM designers ORDER BY id LIMIT 2");
  let blocked = false; try { await makeProject(lead.id); } catch { blocked = true; }
  check("Make a Project blocked until designer + deal value + note", blocked);

  await assignLead(lead.id, a.id, a.id);
  check("Assigned lead appears only in that designer's dashboard", (await listLeads(a.id)).some((l) => l.id === lead.id) && !(await listLeads(b.id)).some((l) => l.id === lead.id));
  await updateLead(lead.id, a.id, { deal_value: 1800000, note: "Send revised moodboard; confirm study layout." });
  check("Deal value + note saved, to-dos ticked", (await q("SELECT 1 FROM todos WHERE lead_id=$1 AND kind IN ('deal_value','note') AND done", [lead.id])).length === 2);

  const pid = await makeProject(lead.id);
  const proj = (await listProjects()).find((p) => p.id === pid)!;
  check("Project card named '<Surname> Residence'", proj.name === "Mehta Residence", proj.name);
  check("Card image is a shipped file", /^\/projects\/flat-\d+\.\w+$/.test(proj.image), proj.image);
  check("Project shows in owner's dashboard only", (await listProjects(a.id)).some((p) => p.id === pid) && !(await listProjects(b.id)).some((p) => p.id === pid));

  for (const st of ["procurement", "building"] as const) { await moveProject(pid, st); }
  check("Moved across Procurement and Building", (await listProjects()).find((p) => p.id === pid)!.stage === "building");
  await moveProject(pid, "completion");
  const done = (await getLead(lead.id))!;
  check("Completion marks lead complete", done.status === "complete");
  check("Freshsales: deal moved to Closed Won", done.fsWon, done.fsDealId ?? done.fsError ?? "");

  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
