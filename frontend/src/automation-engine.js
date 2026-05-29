
export function getAutomationCandidates(consensus = {}) {
  const tasks = [];
  if (consensus.runbook_id) {
    tasks.push({
      id: consensus.runbook_id,
      name: consensus.runbook_id,
      title: consensus.recommended_fix || consensus.runbook_id,
      type: "runbook",
      runbook_id: consensus.runbook_id,
      description: consensus.summary || consensus.user_reply || "Suggested runbook from consensus."
    });
  }

  if (consensus.recommended_script) {
    tasks.push({
      id: "script_preview",
      name: "script_preview",
      title: "Review suggested PowerShell",
      type: "script",
      description: consensus.recommended_script,
      script: consensus.recommended_script
    });
  }

  return tasks;
}

export function resolveAutomationTask({ task, issue, requester, title, notes, consensus }) {
  if (!task) return null;
  return {
    ...task,
    resolved_at: new Date().toISOString(),
    issue,
    requester,
    title,
    notes,
    consensus_summary: consensus?.summary || "",
    runbook_id: task.runbook_id || consensus?.runbook_id || ""
  };
}
