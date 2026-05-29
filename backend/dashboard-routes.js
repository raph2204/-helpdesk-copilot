
import { Router } from "express";
import { db } from "./db.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/dashboard/summary", (req, res) => {
  const one = (sql) => db.prepare(sql).get()?.count || 0;
  res.json({
    tickets_count: one("SELECT COUNT(*) count FROM tickets"),
    outcomes_count: one("SELECT COUNT(*) count FROM outcomes"),
    approvals_count: one("SELECT COUNT(*) count FROM approvals"),
    executions_count: one("SELECT COUNT(*) count FROM execution_logs"),
    consensus_count: one("SELECT COUNT(*) count FROM consensus_history"),
    knowledge_count: one("SELECT COUNT(*) count FROM knowledge_documents")
  });
});
