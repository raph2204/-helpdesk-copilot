# Helpdesk Copilot Rebuild

Recovered clean starter version based on the prior Helpdesk Copilot design.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite using better-sqlite3
- Recommended: Node 22 LTS

## Start backend

```powershell
cd C:\Users\raphaeli\helpdesk-copilot\backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:3001/api
```

## Start frontend

Open a second terminal:

```powershell
cd C:\Users\raphaeli\helpdesk-copilot\frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Optional AI keys

Create this file:

```text
backend\.env
```

Example:

```text
PORT=3001
OPENAI_API_KEY=<add-your-key-locally-only>
ANTHROPIC_API_KEY=<add-your-key-locally-only>
XAI_API_KEY=<add-your-key-locally-only>
```

Without API keys, the app still runs and uses a local fallback consensus response.

## Restored features
- Ticket intake
- Similar ticket lookup
- Outcome history
- Trusted reference search
- Consensus preview
- GUI steps and PowerShell steps split
- Approval logging
- Execution history
- Dashboard counts
- Safety evaluation
- Basic runbook preview / execute simulation
- Dark ops-console UI
