const API_BASE = "http://localhost:3001/api";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const getBackendHealth = () => apiGet("/health");

export const createTicket = (payload) => apiPost("/tickets", payload);

export const getOutcomes = () => apiGet("/outcomes");

export const createOutcome = (payload) => apiPost("/outcomes", payload);

export const deleteOutcome = (id) => apiDelete(`/outcomes/${id}`);

export const getSimilarTickets = (payload) => apiPost("/tickets/similar", payload);

export const previewRunbook = (payload) => apiPost("/runbooks/preview", payload);

export const executeRunbook = (payload) => apiPost("/runbooks/execute", payload);

export const evaluateRunbookSafety = (payload) => apiPost("/runbooks/safety", payload);

export const previewConsensus = (payload) => apiPost("/consensus/preview", payload);

export const saveApprovalLog = (payload) => apiPost("/approvals/save", payload);

export const getApprovalHistory = () => apiGet("/approvals/history");

export const getExecutionHistory = () => apiGet("/executions/history");

export const clearExecutionHistory = () => apiPost("/executions/clear", {});

export const getMockTickets = () => apiGet("/mock-tickets");

export const getDashboardSummary = () => apiGet("/dashboard/summary");

export const saveConsensusDecision = (payload) => apiPost("/consensus/save", payload);

export const getConsensusHistory = () => apiGet("/consensus/history");

export const searchReferences = (payload) => apiPost("/references/search", payload);

export const uploadKnowledgeDocument = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return fetch(`${API_BASE}/knowledge/upload`, {
    method: "POST",
    body: formData
  }).then(async (res) => {
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  });
};




export const searchKnowledge = (payload) => apiPost("/knowledge/search", payload);