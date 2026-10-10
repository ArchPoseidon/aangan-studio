// After generating, compress: for f in public/projects/*.png; do sips -s format jpeg -s formatOptions 82 -Z 1400 "$f" --out "${f%.png}.jpg" && rm "$f"; done
// Generates mock project cover images with Gemini and writes them to public/projects/.
// Replaceable: drop your own flat-N.jpg / villa-N.jpg files into that folder (any count; see lib/images.ts).
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-2.5-flash-image";
const STYLE =
  "Editorial architectural interior photograph, warm natural light, limestone, walnut wood, boucle, brass accents, olive green and terracotta accents, calm premium Indian luxury home, no people, no text, no watermark, 4:3 landscape, shot on 35mm";

const flats = [
  "curved cream boucle sofa, fluted walnut wall panels, marble coffee table, floor-to-ceiling black-framed window",
  "minimal Japandi living room, low oak sofa, paper lantern, linen curtains, stone side table",
  "modern master bedroom, upholstered bed in oat linen, walnut headboard wall, soft brass sconces",
  "open kitchen and dining, travertine island, walnut cabinetry, olive green tile backsplash, pendant lamps",
  "art deco inspired lounge, terracotta velvet armchairs, brass details, arched mirror, herringbone floor",
  "compact home office nook, walnut desk, cane chair, built-in shelving, indoor plant",
];
const villas = [
  "double-height villa living room, grand staircase, tall arched windows, bespoke chandelier, travertine floor",
  "villa exterior at golden hour, white stucco and timber facade, courtyard with olive tree, infinity pool",
  "villa dining hall opening to a garden courtyard, long walnut table, rattan chairs, stone fireplace",
  "luxury villa master suite, canopy bed, terrace doors to garden, limestone floors, rust-toned drapes",
  "villa lounge with sunken conversation pit, oxblood leather seating, brass bar cart, wood-slat ceiling",
  "villa outdoor veranda, teak daybed, terracotta planters, jali screen, evening lantern light",
];

async function gen(prompt: string, out: string) {
  if (existsSync(out)) return console.log("skip", out);
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${prompt}. ${STYLE}` }] }] }),
      }
    );
    const j: any = await r.json();
    const part = j?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (part) {
      writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      return console.log("ok", out);
    }
    console.error("retry", out, JSON.stringify(j).slice(0, 300));
  }
  throw new Error("failed " + out);
}

(async () => {
  const jobs: [string, string][] = [
    ...flats.map((p, i) => [`Interior of an apartment: ${p}`, `flat-${i + 1}.png`] as [string, string]),
    ...villas.map((p, i) => [`Luxury villa: ${p}`, `villa-${i + 1}.png`] as [string, string]),
  ];
  for (let i = 0; i < jobs.length; i += 3) {
    await Promise.all(jobs.slice(i, i + 3).map(([p, f]) => gen(p, join("public/projects", f))));
  }
})();
