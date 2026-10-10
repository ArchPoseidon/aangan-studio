import { z } from "zod";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

export const Analysis = z.object({
  verdict: z.enum(["qualified", "not_qualified"]),
  reasons: z.array(z.string()).default([]),
  full_name: z.string().nullable().default(null),
  first_name: z.string().nullable().default(null),
  surname: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  property_location: z.string().nullable().default(null),
  property_type: z.string().nullable().default(null),
  key_preferences: z.string().nullable().default(null),
  start_timeline: z.string().nullable().default(null),
  completion_timeline: z.string().nullable().default(null),
  meeting_date: z.string().nullable().default(null), // YYYY-MM-DD
  meeting_time_am_pm: z.enum(["AM", "PM"]).nullable().default(null),
  bullet_points: z.array(z.string()).default([]),
  insights: z.array(z.string()).default([]),
  missing_information: z.array(z.string()).default([]),
  flags: z.array(z.string()).default([]),
});
export type Analysis = z.infer<typeof Analysis>;

const S = (type: string, extra: object = {}) => ({ type, nullable: true, ...extra });
const arr = { type: "ARRAY", items: { type: "STRING" } };
const responseSchema = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["qualified", "not_qualified"] },
    reasons: arr,
    full_name: S("STRING"), first_name: S("STRING"), surname: S("STRING"), phone: S("STRING"),
    property_location: S("STRING"), property_type: S("STRING"), key_preferences: S("STRING"),
    start_timeline: S("STRING"), completion_timeline: S("STRING"),
    meeting_date: S("STRING"), meeting_time_am_pm: S("STRING", { enum: ["AM", "PM"] }),
    bullet_points: arr, insights: arr, missing_information: arr, flags: arr,
  },
  required: ["verdict", "reasons", "full_name", "first_name", "surname", "phone", "property_location", "property_type", "key_preferences", "start_timeline", "completion_timeline", "meeting_date", "meeting_time_am_pm", "bullet_points", "insights", "missing_information", "flags"],
};

const RUBRIC = `You judge phone-call transcripts for Aangan Studio, a custom high-end interior design studio in Pune. Return ONE JSON object.

Fields: verdict ('qualified' or 'not_qualified'); reasons; full_name; first_name; surname; phone (digits with country code if stated, else null); property_location; property_type (e.g. "3 BHK flat", "villa"); key_preferences; start_timeline; completion_timeline; meeting_date (ISO YYYY-MM-DD, resolved from the caller's words using TODAY below; null if not stated); meeting_time_am_pm ('AM' or 'PM'); bullet_points (array, one per distinct detail the caller gave); insights (array, for the designer); missing_information (array of things the designer should still ask); flags (array).

Qualified when ALL hold: genuine prospect for interior design work on a property the studio works on; they gave a property location and type; they gave at least some preferences or timeline; and they agreed a date and AM/PM slot for the designer call.
Not qualified when ANY hold: not a design enquiry (vendor, solicitation, wrong number); work the studio does not do; no genuine intent; or the caller declined a designer call.
Borderline: return 'qualified' with a flag explaining the doubt.
Flags to raise when true: a must-have field is missing; the timeline is unclear; the slot is ambiguous; the caller pressed for pricing; preferences are thin; anything else a designer should know before calling.
Split the caller's full name into first_name and surname (surname = family name, e.g. "Priya Mehta" -> "Mehta"). Use only what is in the transcript; never invent details.`;

export async function analyse(transcript: string, today = new Date()): Promise<Analysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const body = {
    systemInstruction: { parts: [{ text: `${RUBRIC}\n\nTODAY is ${today.toISOString().slice(0, 10)} (${today.toLocaleDateString("en-GB", { weekday: "long" })}).` }] },
    contents: [{ role: "user", parts: [{ text: `Transcript:\n\n${transcript}` }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema, temperature: 0.1 },
  };
  let last = "";
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    const j: any = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      try {
        const a = Analysis.parse(JSON.parse(text));
        if (a.verdict === "qualified" && (!a.property_type || !a.property_location || !a.meeting_date || !a.meeting_time_am_pm) && i < 2) { last = "incomplete fields"; continue; }
        return a;
      } catch (e) { last = String(e); }
    } else last = JSON.stringify(j).slice(0, 300);
  }
  throw new Error("Gemini analysis failed: " + last);
}
