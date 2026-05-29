
import { Router } from "express";
import multer from "multer";
import { db, parseJson, toJson } from "./db.js";

const upload = multer({ storage: multer.memoryStorage() });
export const referenceRoutes = Router();

function normalizeOutcome(row) {
  const usage = Number(row.usage_count || 0);
  const success = Number(row.success_count || 0);
  const failure = Number(row.failure_count || 0);
  const success_rate = usage ? Math.round((success / usage) * 100) : 0;
  return {
    ...row,
    gui_steps: parseJson(row.gui_steps, []),
    powershell_steps: parseJson(row.powershell_steps, []),
    step_by_step_remediation: parseJson(row.step_by_step_remediation, []),
    validation_steps: parseJson(row.validation_steps, []),
    rollback_steps: parseJson(row.rollback_steps, []),
    reference_links: parseJson(row.reference_links, []),
    success_rate
  };
}

referenceRoutes.post("/tickets", (req, res) => {
  const { title = "", requester = "", issue = "", notes = "" } = req.body || {};
  const info = db.prepare(`INSERT INTO tickets (title, requester, issue, notes) VALUES (?, ?, ?, ?)`).run(title, requester, issue, notes);
  res.json({ id: info.lastInsertRowid, ok: true });
});

referenceRoutes.get("/outcomes", (req, res) => {
  const rows = db.prepare(`SELECT * FROM outcomes ORDER BY id DESC LIMIT 100`).all().map(normalizeOutcome);
  res.json(rows);
});

referenceRoutes.post("/outcomes", (req, res) => {
  const b = req.body || {};
  const info = db.prepare(`
    INSERT INTO outcomes
    (ticket_summary, predicted_type, approved_fix, script_path, outcome, notes, requester, gui_steps, powershell_steps, step_by_step_remediation, validation_steps, rollback_steps, reference_links, usage_count, success_count, failure_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.ticket_summary || b.issue || "",
    b.predicted_type || b.classification || "",
    b.approved_fix || b.recommended_fix || "",
    b.script_path || b.recommended_script || "",
    b.outcome || "",
    b.notes || "",
    b.requester || "",
    toJson(b.gui_steps || []),
    toJson(b.powershell_steps || []),
    toJson(b.step_by_step_remediation || []),
    toJson(b.validation_steps || []),
    toJson(b.rollback_steps || []),
    toJson(b.reference_links || []),
    Number(b.usage_count || 0),
    Number(b.success_count || 0),
    Number(b.failure_count || 0)
  );
  res.json({ id: info.lastInsertRowid, ok: true });
});

referenceRoutes.delete("/outcomes/:id", (req, res) => {
  db.prepare(`DELETE FROM outcomes WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

referenceRoutes.get("/similar", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const rows = db.prepare(`SELECT * FROM outcomes ORDER BY id DESC LIMIT 100`).all()
    .map(normalizeOutcome)
    .filter((r) => !q || `${r.ticket_summary} ${r.approved_fix} ${r.notes}`.toLowerCase().includes(q))
    .slice(0, 20);
  res.json(rows);
});

referenceRoutes.get("/references/search", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const rows = db.prepare(`SELECT * FROM outcomes ORDER BY id DESC LIMIT 100`).all()
    .map(normalizeOutcome)
    .filter((r) => !q || `${r.ticket_summary} ${r.approved_fix} ${r.notes}`.toLowerCase().includes(q))
    .slice(0, 20);
  res.json(rows);
});

referenceRoutes.post("/outcomes/:id/usage", (req, res) => {
  const success = req.body?.success === true;
  db.prepare(`
    UPDATE outcomes
    SET usage_count = usage_count + 1,
        success_count = success_count + ?,
        failure_count = failure_count + ?
    WHERE id = ?
  `).run(success ? 1 : 0, success ? 0 : 1, req.params.id);
  res.json({ ok: true });
});

referenceRoutes.post("/knowledge/upload", upload.single("file"), (req, res) => {
  const content = req.file ? req.file.buffer.toString("utf8") : (req.body?.content || "");
  const info = db.prepare(`
    INSERT INTO knowledge_documents (title, source_file, tags, content)
    VALUES (?, ?, ?, ?)
  `).run(req.body?.title || req.file?.originalname || "Untitled", req.file?.originalname || "", req.body?.tags || "", content);
  res.json({ id: info.lastInsertRowid, ok: true });
});

referenceRoutes.get("/knowledge/search", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const rows = db.prepare(`SELECT * FROM knowledge_documents ORDER BY id DESC LIMIT 100`).all()
    .filter((r) => !q || `${r.title} ${r.tags} ${r.content}`.toLowerCase().includes(q))
    .slice(0, 20);
  res.json(rows);
});

referenceRoutes.post("/screenshots/analyze", upload.single("file"), (req, res) => {
  res.json({
    summary: "Screenshot received. Add OCR/vision integration when ready.",
    filename: req.file?.originalname || "",
    suggested_evidence: []
  });
});
