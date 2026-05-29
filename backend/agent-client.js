const API_BASE = 'http://localhost:3001/api';

export async function getAgentNewTickets() {
  const res = await fetch(`${API_BASE}/agent/new-tickets`);
  if (!res.ok) throw new Error('Failed to fetch agent tickets');
  return res.json();
}

export async function getAgentDecision(ticket, consensus) {
  const res = await fetch(`${API_BASE}/agent/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, consensus })
  });
  if (!res.ok) throw new Error('Failed to create agent decision');
  return res.json();
}
