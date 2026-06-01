import express from 'express';
import { buildAgentDecision } from './agent/ticket-agent.js';
import { fetchNewTicketsMock } from './agent/ticket-listener.js';
import { fetchServiceDeskTickets } from "./agent/servicedesk-client.js";

const router = express.Router();

router.get('/agent/new-tickets', async (req, res) => {
  try {
    const tickets = await fetchServiceDeskTickets();
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch tickets' });
  }
});

router.post('/agent/decide', async (req, res) => {
  try {
    const { ticket, consensus } = req.body || {};
    const decision = buildAgentDecision(ticket, consensus);
    res.json(decision);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Agent decision failed' });
  }
});

export default router;
