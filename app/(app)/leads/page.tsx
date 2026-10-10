import { listDesigners, listLeads } from "@/lib/data";
import { LeadsView } from "@/components/LeadsView";

export default async function Leads() {
  const [leads, designers] = await Promise.all([listLeads(), listDesigners()]);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-[30px]">Leads</h1>
      <p className="mb-6 mt-1 text-mute">{leads.length} qualified {leads.length === 1 ? "lead" : "leads"} from inbound calls. Assigned leads stay here with the designer&apos;s name.</p>
      <LeadsView leads={leads} designers={designers} empty="No qualified leads yet. They appear here as soon as a call qualifies." />
    </div>
  );
}
