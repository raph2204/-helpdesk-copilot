
import { Router } from "express";
import { db, parseJson, toJson } from "./db.js";

export const approvalRoutes = Router();

approvalRoutes.post("/approvals", (req, res) => {
  const { title = "", requester = "", issue = "", approved = false, consensus = {}, task = {} } = req.body || {};
  const info = db.prepare(`
    INSERT INTO approvals (title, requester, issue, approved, consensus_json, task_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, requester, issue, approved ? 1 : 0, toJson(consensus), toJson(task));
  res.json({ id: info.lastInsertRowid, ok: true });
});

approvalRoutes.get("/approvals", (req, res) => {
  const rows = db.prepare(`SELECT * FROM approvals ORDER BY id DESC LIMIT 100`).all()
    .map((r) => ({ ...r, approved: Boolean(r.approved), consensus: parseJson(r.consensus_json, {}), task: parseJson(r.task_json, {}) }));
  res.json(rows);
});

approvalRoutes.get("/approvals/history", (req, res) => {
  res.json([]);
});


export default approvalRoutes;