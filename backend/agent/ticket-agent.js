// Helpdesk Copilot Ticket Agent
// Phase 1: draft-only agent. It analyzes tickets and prepares replies, but does not post/close tickets automatically.

export function classifyRisk(ticket = {}, consensus = {}) {
  const text = `${ticket.title || ''} ${ticket.issue || ticket.description || ''} ${ticket.notes || ''}`.toLowerCase();

  const highRiskWords = [
    'delete', 'remove user', 'disable user', 'terminate', 'production', 'firewall',
    'restart server', 'reboot server', 'domain controller', 'exchange permission',
    'mailbox permission', 'admin access', 'security group', 'vpn access', 'privileged'
  ];

  const lowRiskWords = [
    'how do i', 'how to', 'printer offline', 'outlook cache', 'password reset instructions',
    'teams not opening', 'browser cache', 'wifi instructions'
  ];

  if (highRiskWords.some((w) => text.includes(w))) {
    return { risk: 'High', action: 'approval_required' };
  }

  if (consensus?.risk?.approval_required === true) {
    return { risk: consensus?.risk?.risk_level || 'Medium', action: 'approval_required' };
  }

  if (lowRiskWords.some((w) => text.includes(w))) {
    return { risk: 'Low', action: 'draft_only' };
  }

  return { risk: 'Medium', action: 'draft_only' };
}

export function buildAgentDecision(ticket = {}, consensus = {}) {
  const gate = classifyRisk(ticket, consensus);

  const recommendedReply =
    consensus?.remediation?.user_reply ||
    consensus?.user_reply ||
    `Hi ${ticket.requester || 'there'},\n\nWe reviewed your request and are checking the next best steps. We will follow up shortly with an update.\n\nThank you.`;

  return {
    mode: 'copilot_draft_only',
    ticket_id: ticket.id || null,
    title: ticket.title || '',
    requester: ticket.requester || '',
    risk: gate.risk,
    action: gate.action,
    confidence: consensus?.confidence || consensus?.remediation?.confidence || 0.6,
    draft_reply: recommendedReply,
    recommended_fix: consensus?.recommended_fix || consensus?.remediation?.recommended_fix || '',
    gui_steps: consensus?.gui_steps || consensus?.remediation?.gui_steps || [],
    powershell_steps: consensus?.powershell_steps || consensus?.remediation?.powershell_steps || [],
    validation_steps: consensus?.validation_steps || consensus?.remediation?.validation_steps || [],
    rollback_steps: consensus?.rollback_steps || consensus?.remediation?.rollback_steps || [],
    guardrail_note:
      gate.action === 'approval_required'
        ? 'Approval is required before replying, changing access, running scripts, restarting services, or closing this ticket.'
        : 'Safe draft generated. Review before posting to the ticketing system.'
  };
}
