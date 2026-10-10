// Freshsales sync. The Leads module is not accessible to this API key (403 Access Denied), so a qualified lead is mirrored as a
// Contact (keyed on phone) plus a linked Deal. Closed Won = that deal moved to the pipeline's "Closed Won" stage. See QUESTIONS.md.
const BASE = () => `https://${process.env.FRESHSALES_DOMAIN ?? "mesa-team.myfreshworks.com"}/crm/sales/api`;

async function fs(method: string, path: string, body?: unknown) {
  const key = process.env.FRESHSALES_API_KEY;
  if (!key) throw new Error("FRESHSALES_API_KEY missing");
  const r = await fetch(BASE() + path, {
    method, headers: { Authorization: `Token token=${key}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Freshsales ${method} ${path} -> ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

// The account has one Freshsales user; the 14 dummy designers cannot map 1:1, so everything is owned by this user
// and the designer's name travels as a tag on the contact.
let ownerCache: number | undefined;
async function defaultOwner(): Promise<number | undefined> {
  if (process.env.FRESHSALES_OWNER_ID) return Number(process.env.FRESHSALES_OWNER_ID);
  return (ownerCache ??= (await fs("GET", "/selector/owners")).users?.[0]?.id);
}

async function stages() {
  const s = (await fs("GET", "/selector/deal_stages")).deal_stages as any[];
  return {
    first: s.find((x) => x.choice_type === 5) ?? s[0],
    won: s.find((x) => x.forecast_type === "Closed Won"),
  };
}

export type FsLead = {
  phone: string; firstName?: string | null; surname?: string | null; fullName: string; designer?: string | null;
  dealValue?: number | null; city?: string | null; propertyType?: string | null; contactId?: string | null; dealId?: string | null;
};

const digits = (p: string) => p.replace(/\D/g, "");

/** Create-or-update the contact (phone is the unique identifier) and its deal. Returns Freshsales ids. */
export async function upsertLead(l: FsLead): Promise<{ contactId: string; dealId: string }> {
  const owner = await defaultOwner();
  const phone = digits(l.phone);
  const found = l.contactId ? { id: l.contactId } : (await fs("GET", `/lookup?q=${phone}&f=mobile_number&entities=contact`)).contacts?.contacts?.[0];
  const contact = {
    first_name: l.firstName ?? undefined, last_name: l.surname ?? l.fullName, mobile_number: phone, city: l.city ?? undefined, owner_id: owner,
    tags: ["Aangan Studio", ...(l.designer ? [`Designer: ${l.designer}`] : [])],
  };
  let contactId: string;
  if (found) { await fs("PUT", `/contacts/${found.id}`, { contact }); contactId = String(found.id); }
  else contactId = String((await fs("POST", "/contacts", { contact: { ...contact, emails: [{ value: `${phone}@no-email.invalid`, is_primary: true }] } })).contact.id);

  const deal = { name: `${l.fullName}${l.propertyType ? ` · ${l.propertyType}` : ""}`, amount: l.dealValue ?? undefined, owner_id: owner };
  let dealId = l.dealId;
  if (dealId) await fs("PUT", `/deals/${dealId}`, { deal });
  else dealId = String((await fs("POST", "/deals", { deal: { ...deal, deal_stage_id: (await stages()).first.id, contacts_added_list: [Number(contactId)] } })).deal.id);
  return { contactId, dealId };
}

export async function addNote(contactId: string, text: string) {
  await fs("POST", "/notes", { note: { description: text, targetable_type: "Contact", targetable_id: Number(contactId) } });
}

/** Closed Won: the stage is read from the pipeline (forecast_type "Closed Won"), never hard-coded. */
export async function closeWon(dealId: string, name: string, amount: number): Promise<{ stage: string }> {
  const { won } = await stages();
  if (!won) throw new Error("No Closed Won stage found in the Freshsales pipeline");
  await fs("PUT", `/deals/${dealId}`, { deal: { name, amount, deal_stage_id: won.id } });
  return { stage: won.name };
}
