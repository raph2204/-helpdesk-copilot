
function arr(v) {
  return Array.isArray(v) ? v.filter(Boolean) : v ? [String(v)] : [];
}
function unique(items) {
  return [...new Set(items.map((x) => String(x).trim()).filter(Boolean))];
}
export function mergeVotes(votes = [], fallback = {}) {
  const valid = votes.filter(Boolean);
  if (!valid.length) return fallback;

  const first = valid[0];
  return {
    ...fallback,
    ...first,
    gui_steps: unique(valid.flatMap((v) => arr(v.gui_steps))),
    powershell_steps: unique(valid.flatMap((v) => arr(v.powershell_steps))),
    step_by_step_remediation: unique(valid.flatMap((v) => arr(v.step_by_step_remediation))),
    validation_steps: unique(valid.flatMap((v) => arr(v.validation_steps))),
    rollback_steps: unique(valid.flatMap((v) => arr(v.rollback_steps))),
    reference_links: unique(valid.flatMap((v) => arr(v.reference_links))),
    model_votes: valid.map((v, i) => ({ provider: v.provider || `model_${i + 1}`, recommended_fix: v.recommended_fix, confidence: v.confidence }))
  };
}
