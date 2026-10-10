const STYLES: [RegExp, string][] = [
  [/japandi/i, "Japandi"], [/art ?deco/i, "Art Deco"], [/minimal/i, "Minimalist"], [/modern classic|neo-?classic/i, "Modern Classic"],
  [/contemporary/i, "Contemporary"], [/mediterranean/i, "Mediterranean"], [/boho|bohemian/i, "Bohemian"], [/traditional|ethnic/i, "Traditional"],
  [/scandi/i, "Scandinavian"], [/luxur/i, "Luxury"], [/warm|earthy|natural/i, "Warm Natural"], [/modern/i, "Modern"],
];
const MATERIALS: [RegExp, string, string][] = [
  [/walnut/i, "Walnut", "#6B4A35"], [/oak|timber|wood|teak/i, "Oak", "#B58B5C"], [/marble/i, "Marble", "#DAD6CF"], [/travertine|limestone|stone/i, "Travertine", "#D8C9AE"],
  [/brass|gold/i, "Brass", "#B8923F"], [/bou?cl[eé]|linen|cotton/i, "Linen", "#E8DFCF"], [/terracotta|clay/i, "Terracotta", "#C7785C"], [/olive|green/i, "Olive", "#354838"],
  [/cane|rattan/i, "Cane", "#C9A66B"], [/velvet|leather/i, "Leather", "#783F46"],
];
export function styleTags(pref: string | null | undefined, kind: string): string[] {
  const out = STYLES.filter(([r]) => r.test(pref ?? "")).map(([, n]) => n).slice(0, 2);
  return out.length ? out : [kind === "villa" ? "Villa" : "Apartment"];
}
export function materialChips(pref: string | null | undefined) {
  return MATERIALS.filter(([r]) => r.test(pref ?? "")).map(([, name, color]) => ({ name, color })).slice(0, 3);
}
