// Creates (or updates, if VAANI_AGENT_ID is set) the Aangan voice agent from agent/system_prompt.md.
import { readFileSync, appendFileSync } from "node:fs";
import { createAgent, patchPersona } from "../lib/vaani";

const persona = {
  identity: {
    system_prompt: readFileSync("agent/system_prompt.md", "utf8"),
    greeting_message: {
      agent_message: "Good day, and thank you for calling Aangan Studio. May I have your full name, please?",
      agent_speech_delay: 1, interruptible: true, let_user_speak_first: false,
    },
  },
  senses_capabilities: { language: "en", auto_detect: false },
};

(async () => {
  const id = process.env.VAANI_AGENT_ID;
  if (id) { console.log(JSON.stringify(await patchPersona(id, persona)).slice(0, 300)); return; }
  const r = await createAgent("aangan-studio-front-desk", { persona });
  console.log(r);
  appendFileSync(".env", `\nVAANI_AGENT_ID=${r.agent_id}\n`);
  console.log("VAANI_AGENT_ID written to .env");
})().catch((e) => { console.error(e); process.exit(1); });
