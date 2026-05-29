
import OpenAI from "openai";

function tryParseJson(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

export async function callOpenAI({ rolePrompt, ticket }) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [
      { role: "system", content: rolePrompt },
      { role: "user", content: JSON.stringify(ticket, null, 2) }
    ],
    temperature: 0.2
  });
  return tryParseJson(completion.choices?.[0]?.message?.content);
}

export async function callClaude() {
  return null; // placeholder: add Anthropic key/client when ready
}

export async function callGrok() {
  return null; // placeholder: add xAI key/client when ready
}

export function fallbackConsensus(ticket = {}) {
  const text = `${ticket.title || ""} ${ticket.issue || ""} ${ticket.notes || ""}`.toLowerCase();
  const printer = /print|printer|spooler/.test(text);
  const rdp = /rdp|remote desktop/.test(text);
  const mailbox = /mailbox|outlook|email|calendar/.test(text);

  let classification = "Manual Review Needed";
  let category = "General";
  let runbook_id = "";
  let fix = "Review issue and collect evidence";

  if (printer) {
    classification = "Unable to Print";
    category = "Endpoint / Printing";
    runbook_id = "restart_print_spooler";
    fix = "Validate printer queue and restart Print Spooler if approved";
  } else if (rdp) {
    classification = "RDP Connectivity Issue";
    category = "Server / Access";
    fix = "Validate network, firewall, and Remote Desktop service status";
  } else if (mailbox) {
    classification = "Outlook / Mailbox Issue";
    category = "Exchange / Mailbox";
    fix = "Validate Outlook profile, mailbox permissions, and service health";
  }

  return {
    classification,
    category,
    priority: "Normal",
    affected_system: category,
    summary: ticket.issue || ticket.title || "No issue details provided.",
    risk_level: runbook_id ? "Medium" : "Low",
    approval_required: Boolean(runbook_id),
    escalation_flags: runbook_id ? ["approval_required"] : [],
    policy_blockers: [],
    recommended_fix: fix,
    runbook_id,
    recommended_script: printer ? "Get-Service Spooler | Select-Object Name, Status, StartType" : "",
    gui_steps: [
      "Confirm the affected user, device, application, and exact error message.",
      "Reproduce or verify the issue using the same path the user reported.",
      "Check whether the issue affects one user/device or multiple users/devices.",
      "Document the current state before making any change."
    ],
    powershell_steps: [
      "Open PowerShell as Administrator only if a command-line check is needed.",
      "Run read-only validation commands first before making any service or configuration change."
    ],
    step_by_step_remediation: [
      "Collect the affected user, device, timestamp, and error details.",
      "Review similar tickets and trusted references.",
      "Apply the lowest-risk fix first.",
      "Validate with the user after the change."
    ],
    validation_steps: [
      "Confirm the original issue no longer occurs.",
      "Confirm no new error appears after the fix.",
      "Update the ticket with the exact action taken and result."
    ],
    rollback_steps: [
      "If the change makes the issue worse, revert the last change immediately.",
      "If rollback is not clear, stop and escalate to the system owner."
    ],
    reference_links: [],
    user_reply: "I reviewed the issue and will proceed with the safest validation and remediation steps.",
    confidence: 0.72,
    model_votes: [
      { provider: "local_fallback", recommended_fix: fix, confidence: 0.72 }
    ]
  };
}
