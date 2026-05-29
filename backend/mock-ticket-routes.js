import express from "express";

export const mockTicketRoutes = express.Router();

let mockTickets = [
  {
    id: "mock-001",
    title: "User cannot print",
    requester: "Test User",
    description: "Printer shows offline when user prints to HP-LaserJet-3rdFloor.",
    status: "Open",
    source: "Mock"
  },
  {
    id: "mock-002",
    title: "PRTG WMI sensor error",
    requester: "Monitoring",
    description: "PRTG sensor showing WMI error 80080005 Server execution failed.",
    status: "Open",
    source: "Mock"
  }
];

mockTicketRoutes.get("/mock-tickets", (req, res) => {
  res.json({ tickets: mockTickets });
});

mockTicketRoutes.post("/mock-tickets", (req, res) => {
  const ticket = req.body;

  if (!ticket.title && !ticket.subject) {
    return res.status(400).json({ error: "Ticket title or subject is required" });
  }

  const newTicket = {
    id: ticket.id || `mock-${Date.now()}`,
    title: ticket.title || ticket.subject,
    requester: ticket.requester || "Unknown",
    description: ticket.description || ticket.body || "",
    status: ticket.status || "Open",
    source: "Manual/Mock"
  };

  mockTickets.unshift(newTicket);

  res.json({
    message: "Ticket added",
    ticket: newTicket
  });
});