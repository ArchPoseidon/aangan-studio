"use client";
import { Clock, MoreHorizontal, Phone, MessageCircle } from "lucide-react";
import type { Project } from "@/lib/data";
import { Avatar, Pill } from "./ui";
import { dueIn, inr } from "@/lib/format";
import { materialChips, styleTags } from "@/lib/tags";
import { STAGES } from "@/lib/actions-shared";

export type Density = "compact" | "standard" | "editorial";

export function ProjectCard({ p, density, ghost }: { p: Project; density: Density; ghost?: boolean }) {
  const stage = STAGES.find((s) => s.id === p.stage)!;
  const due = dueIn(p.endDate);
  const tags = styleTags(p.preferences, p.kind);
  const nextAction = p.note.split(/\n/)[0];
  const cls = `group relative rounded-2xl border border-line bg-ivory p-3 shadow-card transition duration-200 ${ghost ? "opacity-40 border-dashed" : "hover:-translate-y-[2px] hover:shadow-lift"}`;

  if (density === "compact")
    return (
      <div className={cls}>
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 font-serif text-[16px] font-semibold leading-snug">{p.name}</h4>
          <span className="text-[13px] font-semibold text-olive">{inr(p.dealValue)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Pill tone={p.stage}>{stage.short}</Pill>
          {due && <span className={`inline-flex items-center gap-1 text-[12px] ${due.late ? "text-oxblood" : "text-mute"}`}><Clock size={12} />{due.text}</span>}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-mute"><Avatar name={p.designerName ?? "?"} size={20} />{p.designerName}</div>
      </div>
    );

  const editorial = density === "editorial";
  return (
    <div className={cls}>
      <div className={`relative overflow-hidden rounded-[10px] bg-limestone ${editorial ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt={`${p.name} cover`} className="h-full w-full object-cover" loading="lazy" draggable={false} />
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100" onPointerDown={(e) => e.stopPropagation()}>
          <a href={`tel:${p.phone}`} onClick={(e) => e.stopPropagation()} aria-label="Call client" className="rounded-lg bg-ivory/95 p-1.5 shadow-card hover:bg-white"><Phone size={13} /></a>
          <a href={`sms:${p.phone}`} onClick={(e) => e.stopPropagation()} aria-label="Message client" className="rounded-lg bg-ivory/95 p-1.5 shadow-card hover:bg-white"><MessageCircle size={13} /></a>
          <span className="rounded-lg bg-ivory/95 p-1.5 shadow-card"><MoreHorizontal size={13} /></span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Pill tone={p.stage}>{stage.short}</Pill>
        {due && <span className={`inline-flex items-center gap-1 text-[12px] ${due.late ? "text-oxblood" : "text-mute"}`}><Clock size={12} />{due.text}</span>}
      </div>
      <h4 className="mt-2 line-clamp-2 font-serif text-[16px] font-semibold leading-snug">{p.name}</h4>
      <div className="truncate text-[12px] text-mute">{[p.propertyType, p.location].filter(Boolean).join(" · ")}</div>
      <div className="mt-2 text-[15px] font-semibold text-olive">{inr(p.dealValue)}</div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {editorial
          ? materialChips(p.preferences).map((m) => <span key={m.name} className="pill bg-limestone text-ink/80"><i className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: m.color }} />{m.name}</span>)
          : null}
        {tags.map((t) => <span key={t} className="pill bg-limestone text-ink/70">{t}</span>)}
      </div>
      {editorial && nextAction && <p className="mt-2 line-clamp-1 text-[12px] text-ink/70">Next: {nextAction}</p>}
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5 text-[12px]">
        <Avatar name={p.designerName ?? "?"} size={22} />
        <span className="font-medium">{p.designerName}</span>
        <span className="ml-auto truncate text-mute">{p.client}</span>
      </div>
    </div>
  );
}
