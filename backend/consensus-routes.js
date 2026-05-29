
import { Router } from "express";
import { buildConsensus } from "./consensus-engine/orchestrator.js";
import { db, parseJson, toJson } from "./db.js";

export const consensusRoutes = Router();

consensusRoutes.post("/consensus/preview", async (req, res) => {
  const consensus = await buildConsensus(req.body || {});
  res.json({ consensus });
});

consensusRoutes.post("/consensus/save", (req, res) => {
  const { title = "", requester = "", issue = "", consensus = {} } = req.body || {};
  const info = db.prepare(`
    INSERT INTO consensus_history (title, requester, issue, consensus_json)
    VALUES (?, ?, ?, ?)
  `).run(title, requester, issue, toJson(consensus));
  res.json({ id: info.lastInsertRowid, ok: true });
});

consensusRoutes.get("/consensus/history", (req, res) => {
  const rows = db.prepare(`SELECT * FROM consensus_history ORDER BY id DESC LIMIT 100`).all()
    .map((r) => ({ ...r, consensus: parseJson(r.consensus_json, {}) }));
  res.json(rows);
});
