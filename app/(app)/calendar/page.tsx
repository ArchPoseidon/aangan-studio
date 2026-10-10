import { requireDesigner } from "@/lib/auth";
import { listDesigners, listLeads, listProjects } from "@/lib/data";
import { CalendarView, type CalEvent } from "@/components/CalendarView";

export default async function CalendarPage() {
  const me = await requireDesigner();
  const [leads, projects, designers] = await Promise.all([listLeads(me.id), listProjects(me.id), listDesigners()]);
  const events: CalEvent[] = [
    ...leads.filter((l) => l.meetingDate).map((l): CalEvent => ({ date: l.meetingDate!, kind: "meeting", label: l.fullName, sub: l.meetingAmPm ?? "", leadId: l.id })),
    ...projects.flatMap((p): CalEvent[] => [
      ...(p.startDate ? [{ date: p.startDate, kind: "start" as const, label: p.name, sub: "", projectId: p.id }] : []),
      ...(p.endDate ? [{ date: p.endDate, kind: "due" as const, label: p.name, sub: "", projectId: p.id }] : []),
    ]),
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-[30px]">Calendar</h1>
      <p className="mb-6 mt-1 text-mute">Your designer calls and project dates. Meetings are booked by the voice agent; start and end dates come from each project card.</p>
      <CalendarView events={events} designers={designers} />
    </div>
  );
}
