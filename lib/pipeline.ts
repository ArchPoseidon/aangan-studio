import { q, q1 } from "./db";
import { analyse } from "./gemini";
import { upsertLead, addNote } from "./freshsales";
import { propertyKind } from "./images";

/** E.164-ish: a bare 10-digit number is treated as Indian (+91). */
const normPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10) return "+91" + d;
  return "+" + d;
};
const slot = (d: string | null, ap: string | null) => (d ? `${d} ${ap ?? ""}`.trim() : "the agreed slot");

/** transcript in -> Gemini verdict -> (qualified only) lead + todos + Freshsales. Not-qualified calls stay in `calls` only. */
export async function processCall(o: { vaaniCallId: string; transcript: string; phone?: string | null; source?: string }) {
  const existing = await q1("SELECT id, verdict FROM calls WHERE vaani_call_id=$1", [o.vaaniCallId]);
  if (existing) return { callId: existing.id, qualified: existing.verdict === "qualified", duplicate: true as const };

  const a = await analyse(o.transcript);
  const call = (await q<{ id: number }>(
    "INSERT INTO calls (vaani_call_id, source, transcript, verdict, analysis) VALUES ($1,$2,$3,$4,$5) RETURNING id",
    [o.vaaniCallId, o.source ?? "vaani", o.transcript, a.verdict, JSON.stringify(a)]
  ))[0];
  if (a.verdict !== "qualified") return { callId: call.id, qualified: false, reasons: a.reasons };

  const phone = normPhone(o.phone ?? a.phone ?? "") || `unknown-${call.id}`;
  const fullName = a.full_name ?? "Unknown caller";
  const surname = a.surname ?? fullName.split(/\s+/).slice(-1)[0];
  const flags = [...a.flags];
  if (phone.startsWith("unknown-")) flags.push("No phone number captured on the call; add it before contacting the caller.");

  const lead = (await q<{ id: number; fresh: boolean }>(
    `INSERT INTO leads (call_id, phone, full_name, first_name, surname, property_location, property_type, property_kind, key_preferences,
       start_timeline, completion_timeline, meeting_date, meeting_ampm, bullet_points, insights, missing_information, flags, transcript)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (phone) DO UPDATE SET call_id=EXCLUDED.call_id, property_location=EXCLUDED.property_location, property_type=EXCLUDED.property_type,
       property_kind=EXCLUDED.property_kind, key_preferences=EXCLUDED.key_preferences, start_timeline=EXCLUDED.start_timeline,
       completion_timeline=EXCLUDED.completion_timeline, meeting_date=EXCLUDED.meeting_date, meeting_ampm=EXCLUDED.meeting_ampm,
       bullet_points=EXCLUDED.bullet_points, insights=EXCLUDED.insights, missing_information=EXCLUDED.missing_information,
       flags=EXCLUDED.flags, transcript=EXCLUDED.transcript
     RETURNING id, (xmax = 0) AS fresh`,
    [call.id, phone, fullName, a.first_name, surname, a.property_location, a.property_type, propertyKind(a.property_type), a.key_preferences,
     a.start_timeline, a.completion_timeline, a.meeting_date, a.meeting_time_am_pm, JSON.stringify(a.bullet_points), JSON.stringify(a.insights),
     JSON.stringify(a.missing_information), JSON.stringify(flags), o.transcript]
  ))[0];

  if (lead.fresh) {
    const todos: [string, string, string | null][] = [
      ["deal_value", "Update the deal value", "now() + interval '24 hours'"],
      ["note", "Write a note on this lead", "now() + interval '24 hours'"],
      ["meeting", `Be ready for the meeting: ${slot(a.meeting_date, a.meeting_time_am_pm)}`, null],
      ...a.missing_information.map((m): [string, string, null] => ["question", `Ask: ${m}`, null]),
    ];
    for (const [kind, text, due] of todos)
      await q(`INSERT INTO todos (lead_id, kind, text, due_at) VALUES ($1,$2,$3,${due ?? "NULL"})`, [lead.id, kind, text]);
  }
  await syncLead(lead.id);
  return { callId: call.id, leadId: lead.id, qualified: true };
}

/** Push the lead's current state to Freshsales. Never throws; the outcome is recorded on the lead. */
export async function syncLead(leadId: number) {
  const l = await q1<any>(
    "SELECT l.*, d.name AS designer FROM leads l LEFT JOIN designers d ON d.id=l.designer_id WHERE l.id=$1", [leadId]);
  if (!l) return;
  if (String(l.phone).startsWith("unknown-")) {
    await q("UPDATE leads SET freshsales_error=$2 WHERE id=$1", [leadId, "Not synced: no phone number was captured on the call (the phone is the Freshsales identifier)."]);
    return;
  }
  try {
    const r = await upsertLead({
      phone: l.phone, firstName: l.first_name, surname: l.surname, fullName: l.full_name, designer: l.designer,
      dealValue: l.deal_value == null ? null : Number(l.deal_value), city: l.property_location, propertyType: l.property_type,
      contactId: l.freshsales_lead_id, dealId: l.freshsales_deal_id,
    });
    await q("UPDATE leads SET freshsales_lead_id=$2, freshsales_deal_id=$3, freshsales_error=NULL WHERE id=$1", [leadId, r.contactId, r.dealId]);
  } catch (e: any) {
    await q("UPDATE leads SET freshsales_error=$2 WHERE id=$1", [leadId, String(e.message ?? e)]);
  }
}

export async function syncNote(leadId: number, text: string, designer: string) {
  const l = await q1<any>("SELECT freshsales_lead_id FROM leads WHERE id=$1", [leadId]);
  if (!l?.freshsales_lead_id) return;
  try { await addNote(l.freshsales_lead_id, `[${designer}] ${text}`); } catch (e: any) {
    await q("UPDATE leads SET freshsales_error=$2 WHERE id=$1", [leadId, String(e.message ?? e)]);
  }
}
