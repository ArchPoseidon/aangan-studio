"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import type { Lead } from "@/lib/data";
import { Avatar, Pill } from "./ui";
import { LeadPanel } from "./LeadPanel";
import { inr, meeting } from "@/lib/format";

export function LeadsView({ leads, designers, empty }: { leads: Lead[]; designers: { id: number; name: string }[]; empty: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  async function assign(id: number, designerId: string) {
    await fetch(`/api/lead/${id}`, { method: "PATCH", body: JSON.stringify({ designerId: designerId || null }) });
    router.refresh();
  }
  if (!leads.length) return <div className="card p-10 text-center text-mute">{empty}</div>;
  return (
    <>
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[2fr_1.3fr_1.1fr_.8fr_1.4fr] gap-4 border-b border-line px-5 py-3 text-[12px] text-mute md:grid">
          <span>Name</span><span>Property</span><span>Meeting</span><span>Deal</span><span>Designer</span>
        </div>
        {leads.map((l) => (
          <div key={l.id} onClick={() => setOpen(l.id)}
            className="grid cursor-pointer grid-cols-1 items-center gap-2 border-b border-line px-5 py-3.5 transition last:border-0 hover:bg-limestone/60 md:grid-cols-[2fr_1.3fr_1.1fr_.8fr_1.4fr] md:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={l.fullName} size={34} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 truncate font-semibold">{l.fullName}
                  {l.overdue && <span title="Overdue: deal value / note not updated within 24h" className="text-oxblood"><Flag size={13} /></span>}
                  {l.flags.length > 0 && !l.overdue && <span title={`${l.flags.length} flag(s)`} className="text-[#A08626]"><Flag size={13} /></span>}
                </div>
                <div className="text-[12px] text-mute">{l.phone}</div>
              </div>
            </div>
            <div className="min-w-0 truncate text-[13px]">{l.propertyType ?? "—"}<div className="truncate text-[12px] text-mute">{l.location}</div></div>
            <div className="text-[13px]">{meeting(l.meetingDate, l.meetingAmPm)}</div>
            <div className="text-[13px]">{inr(l.dealValue)}</div>
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
              {l.status !== "lead" ? <Pill tone={l.status}>{l.status === "project" ? "Project" : "Complete"} · {l.designerName}</Pill> : (
                <select aria-label="Assign designer" className="field !py-1.5 !text-[13px]" value={l.designerId ?? ""} onChange={(e) => assign(l.id, e.target.value)}>
                  <option value="">Assign designer…</option>
                  {designers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
      <LeadPanel leadId={open} designers={designers} onClose={() => setOpen(null)} />
    </>
  );
}
