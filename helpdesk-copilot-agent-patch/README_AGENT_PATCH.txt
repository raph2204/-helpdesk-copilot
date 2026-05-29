Helpdesk Copilot Agent Patch - Phase 1

What this adds:
- backend/agent/ticket-agent.js
- backend/agent/ticket-listener.js
- backend/agent-routes.js
- frontend/src/agent-client.js

Manual step required:
Open backend/server.js and add these two lines.

Near the other imports:
import agentRoutes from './agent-routes.js';

Near the other app.use('/api', ...) route registrations:
app.use('/api', agentRoutes);

Then restart backend:
npm run dev

Test in browser:
http://localhost:3001/api/agent/new-tickets

Expected result:
A mock ticket JSON response.

This is draft-only/copilot mode. It does not post or close tickets automatically.
