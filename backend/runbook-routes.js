
import { Router } from "express";
import { evaluateSafety } from "./safety-policy/engine.js";
import { db, toJson } from "./db.js";

export const runbookRoutes = Router();

const RUNBOOKS = {
  restart_print_spooler: {
    id: "restart_print_spooler",
    title: "Restart Print Spooler",
    description: "Checks and restarts the Print Spooler service after approval.",
    script: "Get-Service Spooler\nRestart-Service Spooler\nGet-Service Spooler"
  },
  inspect_certificate_expiry: {
    id: "inspect_certificate_expiry",
    title: "Inspect Certificate Expiry",
    description: "Read-only certificate expiration inspection.",
    script: "Get-ChildItem Cert:\\LocalMachine\\My | Select Subject, NotAfter"
  },
  review_s_drive_acl: {
    id: "review_s_drive_acl",
    title: "Review S Drive ACL",
    description: "Read-only folder ACL review.",
    script: "Get-Acl S:\\ | Format-List"
  }
};

runbookRoutes.post("/runbooks/preview", (req, res) => {
  const id = req.body?.runbook_id || req.body?.id || "restart_print_spooler";
  const rb = RUNBOOKS[id] || RUNBOOKS.restart_print_spooler;
  res.json({ runbook: rb });
});

runbookRoutes.post("/runbooks/safety", (req, res) => {
  res.json(evaluateSafety(req.body || {}));
});

runbookRoutes.post("/runbooks/execute", (req, res) => {
  const id = req.body?.runbook_id || req.body?.id || "restart_print_spooler";
  const rb = RUNBOOKS[id] || RUNBOOKS.restart_print_spooler;
  const safety = evaluateSafety({ task: rb, script: rb.script, issue: req.body?.issue });
  const approved = Boolean(req.body?.approved);

  if (safety.approval_required && !approved) {
    return res.status(403).json({ error: "Approval required before execution.", safety });
  }
  if (safety.decision === "blocked") {
    return res.status(403).json({ error: "Blocked by safety policy.", safety });
  }

  const result = {
    status: "simulated",
    stdout: `Simulated execution of ${rb.title}. Add real PowerShell runner when ready.`,
    stderr: "",
    exit_code: 0,
    safety
  };

  db.prepare(`
    INSERT INTO execution_logs
    (requester, task_id, runbook_id, risk_level, approved, execution_status, stdout, stderr, exit_code, notes, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.body?.requester || "",
    rb.id,
    rb.id,
    safety.risk_level,
    approved ? 1 : 0,
    result.status,
    result.stdout,
    result.stderr,
    result.exit_code,
    req.body?.notes || "",
    toJson(result)
  );

  res.json(result);
});
