// Prints a Vaani WebRTC session URL. Open it in a browser, allow the microphone, and talk to the agent.
// Usage: npm run call -- +919812345678   (the number is attached to the session so the lead has a phone; WebRTC has no caller ID)
import { createSession } from "../lib/vaani";
(async () => {
  const phone = process.argv[2] ?? null;
  const r = await createSession(process.env.VAANI_AGENT_ID!, { phone, source: "webrtc-test" });
  console.log("Open this URL and speak (expires " + r.expires_at + "):\n" + r.session_url);
})().catch((e) => { console.error(e); process.exit(1); });
