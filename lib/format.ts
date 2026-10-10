export function inr(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
export function meeting(date: string | null, ampm: string | null) {
  if (!date) return "Slot not set";
  const d = new Date(date + "T00:00:00");
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${ampm ? ` · ${ampm}` : ""}`;
}
export function dueIn(date: string | null) {
  if (!date) return null;
  const days = Math.round((new Date(date + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  if (days < 0) return { text: `${-days}d overdue`, late: true };
  if (days === 0) return { text: "Due today", late: false };
  return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, late: false };
}
export const initials = (n: string) => n.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
export function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(m, 0)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}
const PALETTE = ["#E9D5CF", "#D8E2D2", "#E5DCC4", "#DCD5E8", "#D3DEE6", "#EBD9C6"];
export const tint = (s: string) => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
