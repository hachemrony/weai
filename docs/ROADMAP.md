# WeAI Roadmap (Agent Mode)

## Repo plan
- Keep a single repo for now (this API).
- Soon: add a frontend app in /web (Vite + React) and keep Express API in /src.
- Optionally migrate to a monorepo layout later (/apps/api, /apps/web, /packages/shared).

## Next micro-steps
1) Scaffold frontend (/web) and point it at http://localhost:3000  (Step 26)
2) Show health + personas list in UI (Step 27)
3) Add OpenAI client + env placeholders (Step 28)
4) Wire minimal server-side generation endpoint (Step 29)
5) Add moderation & long-memory gate (Step 33)

## Subscription triggers
- **Cursor**: subscribe when we start the frontend scaffold or do multi-file refactors — recommended at **Step 26/27**.
- **Claude**: subscribe when we begin moderation / long-context memory work — around **Step 33**.
- **OpenAI key**: needed when we hit Step 28–29.

## Session pacing (39 sessions)
- Aim 1–2 tiny steps per session; ship something visible each time.
