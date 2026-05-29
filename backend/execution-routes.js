
import { Router } from "express";
import { db, parseJson, toJson } from "./db.js";

export const executionRoutes = Router();

executionRoutes.get("/executions", (req, res) => {
  const rows = db.prepare(`SELECT * FROM execution_logs ORDER BY id DESC LIMIT 100`).all()
    .map((r) => ({ ...r, result: parseJson(r.result_json, {}) }));
  res.json(rows);
});

executionRoutes.post("/executions", (req, res) => {
  const result = req.body?.result || {};
  const info = db.prepare(`
    INSERT INTO execution_logs
    (requester, approved_by, task_id, runbook_id, risk_level, approved, execution_status, stdout, stderr, exit_code, notes, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.body?.requester || "",
    req.body?.approved_by || "",
    req.body?.task_id || "",
    req.body?.runbook_id || "",
    req.body?.risk_level || "",
    req.body?.approved ? 1 : 0,
    req.body?.execution_status || result.status || "",
    result.stdout || "",
    result.stderr || "",
    Number(result.exit_code || 0),
    req.body?.notes || "",
    toJson(result)
  );
  res.json({ id: info.lastInsertRowid, ok: true });
});

executionRoutes.delete("/executions", (req, res) => {
  db.prepare(`DELETE FROM execution_logs`).run();
  res.json({ ok: true });
});

executionRoutes.get("/executions/history", (req, res) => {
  res.json([]);
});