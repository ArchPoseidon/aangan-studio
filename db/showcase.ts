// Mock projects so the board is populated on a fresh install. Inserted directly (no Gemini, no Freshsales).
import { q } from "../lib/db";
import { pickCover } from "../lib/images";

const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const ROWS = [
  { name: "Shah", full: "Neha Shah", ph: "+919800000201", kind: "flat", type: "2 BHK apartment", loc: "Koregaon Park, Pune", pref: "Japandi, light oak, linen, quiet palette", deal: 1200000, des: 2, stage: "ideation", start: 10, end: 120, note: "Send revised moodboard" },
  { name: "Kapoor", full: "Aman Kapoor", ph: "+919800000202", kind: "villa", type: "4 BHK villa", loc: "Kalyani Nagar, Pune", pref: "Modern Classic, marble, brass, walnut", deal: 4800000, des: 1, stage: "ideation", start: 7, end: 200, note: "Walk-through booked for Saturday" },
  { name: "Joshi", full: "Sanjay Joshi", ph: "+919800000203", kind: "flat", type: "3 BHK apartment", loc: "Aundh, Pune", pref: "Contemporary, travertine, cane, olive green", deal: 1500000, des: 4, stage: "procurement", start: -20, end: 45, note: "Confirm tile samples with vendor" },
  { name: "Desai", full: "Pooja Desai", ph: "+919800000204", kind: "villa", type: "5 BHK villa", loc: "Lonavala", pref: "Art Deco, terracotta, velvet, brass", deal: 7000000, des: 5, stage: "procurement", start: -35, end: 90, note: "Chase custom sofa fabric order" },
  { name: "Bhatia", full: "Rajiv Bhatia", ph: "+919800000205", kind: "flat", type: "3 BHK apartment", loc: "Baner, Pune", pref: "Minimalist, oak, limestone, boucle", deal: 3500000, des: 6, stage: "building", start: -60, end: 3, note: "Final carpentry snag list" },
  { name: "Nair", full: "Lakshmi Nair", ph: "+919800000206", kind: "villa", type: "4 BHK villa", loc: "Kothrud, Pune", pref: "Mediterranean, stone, terracotta, olive", deal: 5400000, des: 7, stage: "building", start: -90, end: 30, note: "Courtyard planting next week" },
  { name: "Verma", full: "Anil Verma", ph: "+919800000207", kind: "flat", type: "2 BHK apartment", loc: "Viman Nagar, Pune", pref: "Warm modern, walnut, brass", deal: 1000000, des: 3, stage: "completion", start: -150, end: -7, note: "Handover photoshoot done" },
  { name: "Rao", full: "Deepa Rao", ph: "+919800000208", kind: "villa", type: "4 BHK villa", loc: "Hinjewadi, Pune", pref: "Contemporary, marble, walnut", deal: 6200000, des: 8, stage: "completion", start: -240, end: -20, note: "Final payment received" },
] as const;

export async function seedShowcase() {
  const designers = await q<{ id: number }>("SELECT id FROM designers ORDER BY id");
  if (!designers.length) throw new Error("seed designers first");
  for (const r of ROWS) {
    const lead = await q<{ id: number }>(
      `INSERT INTO leads (phone, full_name, first_name, surname, property_location, property_type, property_kind, key_preferences, start_timeline, completion_timeline,
         meeting_date, meeting_ampm, bullet_points, insights, transcript, designer_id, deal_value, note, status, landed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Soon','As agreed',$9,'AM',$10,'[]',$11,$12,$13,$14,$15, now() - interval '30 days')
       ON CONFLICT (phone) DO NOTHING RETURNING id`,
      [r.ph, r.full, r.full.split(" ")[0], r.name, r.loc, r.type, r.kind, r.pref, day(-30),
       JSON.stringify([`${r.type} in ${r.loc}`, `Style: ${r.pref}`]), `Agent: Good morning, Aangan Studio. May I have your full name?\nCaller: ${r.full}.\nAgent: Thank you. Where is the property?\nCaller: ${r.type}, ${r.loc}.`,
       designers[r.des].id, r.deal, r.note, r.stage === "completion" ? "complete" : "project"]);
    if (!lead[0]) continue;
    const pid = (await q<{ id: number }>(
      `INSERT INTO projects (lead_id, name, stage, image, start_date, end_date, completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [lead[0].id, `${r.name} Residence`, r.stage, pickCover(r.kind, lead[0].id), day(r.start), day(r.end), r.stage === "completion" ? day(r.end) : null]))[0].id;
    await q("INSERT INTO project_notes (project_id, title, body) VALUES ($1,'Call 1 · Discovery call',$2)", [pid, r.note]);
    await q("INSERT INTO lead_updates (lead_id, designer_id, kind, detail) VALUES ($1,$2,'note',$3)", [lead[0].id, designers[r.des].id, r.note]);
  }
}
