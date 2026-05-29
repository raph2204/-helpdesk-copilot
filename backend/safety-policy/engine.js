
const BLOCKED_PATTERNS = [
  /remove-item\s+.*-recurse\s+.*-force/i,
  /format-volume/i,
  /disable-(adaccount|mailbox)/i,
  /stop-service\s+.*guardicore/i,
  /net\s+stop\s+.*guardicore/i
];

const APPROVAL_PATTERNS = [
  /restart-service/i,
  /stop-service/i,
  /start-service/i,
  /net\s+stop/i,
  /net\s+start/i,
  /add-mailboxpermission/i,
  /set-mailbox/i,
  /remove-mailboxpermission/i
];

export function evaluateSafety({ task = {}, script = "", issue = "" }) {
  const haystack = `${task.title || ""}\n${task.description || ""}\n${script}\n${issue}`;

  if (BLOCKED_PATTERNS.some((rx) => rx.test(haystack))) {
    return {
      decision: "blocked",
      risk_level: "Critical",
      approval_required: true,
      reasons: ["Blocked by safety policy pattern."]
    };
  }

  if (APPROVAL_PATTERNS.some((rx) => rx.test(haystack))) {
    return {
      decision: "approval_required",
      risk_level: "Medium",
      approval_required: true,
      reasons: ["Operational change requires approval before execution."]
    };
  }

  return {
    decision: "safe_auto",
    risk_level: "Low",
    approval_required: false,
    reasons: ["Read-only or low-risk operation."]
  };
}
