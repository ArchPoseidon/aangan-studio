# Aangan Studio: call-to-project system (V1)

Vaani answers inbound calls, Gemini judges the transcript, qualified leads land in a Next.js dashboard (Neon Postgres), mirror into Freshsales, and move across a four-stage project board to Closed Won. See `QUESTIONS.md` for every decision and open item.

## Run locally
```bash
npm install
cp .env.example .env      # fill in keys; leave DATABASE_URL empty to use embedded PGlite
npm run db:seed           # 14 designers, 3 sample calls through the real pipeline, 8 showcase projects
npm run dev               # http://localhost:3000
npm run demo              # end-to-end check on a throwaway DB (hits Gemini and Freshsales)
```
Sign in by typing a designer name; the first login creates their PIN.

## Voice agent
- Prompt: `agent/system_prompt.md`. `npm run agent` creates or updates the agent in Vaani and writes `VAANI_AGENT_ID` to `.env`.
- `npm run call -- +91XXXXXXXXXX` prints a WebRTC session URL to talk to the agent.
- Register `https://<your-domain>/api/vaani/webhook` in Vaani under Settings, Webhooks. Only `call_postprocessing` starts the pipeline.
- In Vaani Settings, Integrations, connect Cal.com and add a booking tool to the agent.

## Layout
- `lib/pipeline.ts` transcript to Gemini to lead to Freshsales · `lib/actions.ts` assign, project, stage moves, Closed Won · `lib/freshsales.ts`, `lib/vaani.ts`, `lib/gemini.ts`
- `db/schema.sql`, `db/sample-transcripts.ts`, `db/showcase.ts`
- `app/(app)/` dashboard, leads, projects, calendar · `components/` UI
