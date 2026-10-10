"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, CalendarDays, LogOut, Bell } from "lucide-react";
import { useState } from "react";
import { Avatar } from "./ui";

const NAV = [
  { href: "/dashboard", label: "My Dashboard", Icon: LayoutDashboard },
  { href: "/leads", label: "Leads", Icon: Users },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
];

export function Sidebar({ name, alerts }: { name: string; alerts: { leadId: number; text: string }[] }) {
  const path = usePathname();
  const router = useRouter();
  const [bell, setBell] = useState(false);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[228px] flex-col border-r border-line bg-ivory">
      <div className="px-6 pb-6 pt-7">
        <div className="font-serif text-[24px] leading-none tracking-tight text-ink">Aangan</div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[.28em] text-mute">Studio · Pune</div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, Icon }) => {
          const on = path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition ${on ? "bg-limestone font-semibold text-ink" : "text-ink/65 hover:bg-limestone/60"}`}>
              <Icon size={17} strokeWidth={1.6} className={on ? "text-olive" : ""} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="relative border-t border-line p-3">
        {bell && (
          <div className="fade-enter absolute bottom-full left-3 right-3 mb-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-ivory p-3 shadow-lift">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-mute">Notifications</div>
            {alerts.length ? alerts.map((a) => <Link key={a.leadId} href="/dashboard" onClick={() => setBell(false)} className="block border-t border-line py-2 text-[13px] text-oxblood first:border-0">{a.text}</Link>)
              : <div className="py-2 text-[13px] text-mute">You&apos;re all caught up.</div>}
          </div>
        )}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar name={name} size={30} />
          <div className="min-w-0 flex-1 truncate text-[13px] font-semibold">{name}</div>
          <button onClick={() => setBell((b) => !b)} aria-label="Notifications" className="relative rounded-md p-1.5 text-mute hover:bg-limestone hover:text-ink">
            <Bell size={16} />{alerts.length > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-oxblood" />}
          </button>
        </div>
        <button onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-ink/65 hover:bg-limestone"><LogOut size={17} strokeWidth={1.6} />Logout</button>
      </div>
    </aside>
  );
}
