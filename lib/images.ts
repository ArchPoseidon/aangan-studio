import { readdirSync } from "node:fs";
import { join } from "node:path";

/** Cover images live in public/projects as flat-*.{png,jpg,webp} and villa-*.{png,jpg,webp}. Drop new files there to replace them. */
export function coverSet(kind: "flat" | "villa"): string[] {
  try {
    return readdirSync(join(process.cwd(), "public/projects"))
      .filter((f) => f.startsWith(kind + "-") && /\.(png|jpe?g|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/projects/${f}`);
  } catch { return []; }
}

/** Deterministic: same lead always gets the same cover. */
export function pickCover(kind: "flat" | "villa", leadId: number): string {
  const set = coverSet(kind);
  if (!set.length) return "";
  return set[leadId % set.length];
}

export const propertyKind = (t?: string | null): "flat" | "villa" =>
  /villa|bungalow|house|farm|row ?house|independent/i.test(t ?? "") ? "villa" : "flat";
