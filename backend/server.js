
import agentRoutes from "./agent-routes.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import { consensusRoutes } from "./consensus-routes.js";
import { approvalRoutes } from "./approval-routes.js";
import { executionRoutes } from "./execution-routes.js";
import { dashboardRoutes } from "./dashboard-routes.js";
import { referenceRoutes } from "./reference-routes.js";
import { runbookRoutes } from "./runbook-routes.js";

initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok", app: "Helpdesk Copilot" }));

app.use("/api", consensusRoutes);
app.use("/api", approvalRoutes);
app.use("/api", executionRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", referenceRoutes);
app.use("/api", runbookRoutes);
app.use("/api", agentRoutes);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Helpdesk Copilot backend running on http://localhost:${port}/api`);
});
