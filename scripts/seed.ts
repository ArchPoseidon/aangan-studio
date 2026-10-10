import { q } from "../lib/db";
import { DESIGNERS, SAMPLES } from "../db/sample-transcripts";
import { processCall } from "../lib/pipeline";
import { seedShowcase } from "../db/showcase";

async function main() {
  for (const n of DESIGNERS) await q("INSERT INTO designers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [n]);
  console.log(`designers: ${(await q("SELECT 1 FROM designers")).length}`);
  for (const s of SAMPLES) {
    const r = await processCall({ vaaniCallId: s.id, transcript: s.transcript, phone: s.phone, source: "sample" });
    console.log(s.id, JSON.stringify(r));
  }
  await seedShowcase();
  console.log(`projects: ${(await q("SELECT 1 FROM projects")).length}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
