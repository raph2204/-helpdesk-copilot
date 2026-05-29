
import { useEffect, useMemo, useState } from "react";
import {
  getBackendHealth,
  createTicket,
  getOutcomes,
  createOutcome,
  deleteOutcome,
  getSimilarTickets,
  previewRunbook,
  executeRunbook,
  evaluateRunbookSafety,
  previewConsensus,
  saveApprovalLog,
  getApprovalHistory,
  getExecutionHistory,
  clearExecutionHistory,
  getDashboardSummary,
  saveConsensusDecision,
  getConsensusHistory,
  searchReferences,
  uploadKnowledgeDocument,
  searchKnowledge
} from "./api-client";
import { getAutomationCandidates, resolveAutomationTask } from "./automation-engine";

const DEFAULT_ANALYSIS = {
  summary: "",
  recommended_fix: "",
  recommended_script: "",
  user_reply: "",
  gui_steps: [],
  powershell_steps: [],
  step_by_step_remediation: [],
  validation_steps: [],
  rollback_steps: [],
  reference_links: [],
  votes: [],
  model_votes: [],
  confidence: "",
  reasoning: ""
};

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return value.split(/\r?\n/).map((x) => x.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
  }
  return [];
}

function normalizeConsensus(raw) {
  const data = raw?.consensus || raw || {};
  return {
    ...DEFAULT_ANALYSIS,
    ...data,
    gui_steps: normalizeArray(data.gui_steps),
    powershell_steps: normalizeArray(data.powershell_steps),
    step_by_step_remediation: normalizeArray(data.step_by_step_remediation),
    validation_steps: normalizeArray(data.validation_steps),
    rollback_steps: normalizeArray(data.rollback_steps),
    reference_links: Array.isArray(data.reference_links) ? data.reference_links : [],
    model_votes: Array.isArray(data.model_votes) ? data.model_votes : []
  };
}

function KpiTile({ label, value, tone = "default" }) {
  return <div className={`kpi-tile kpi-${tone}`}><div>{label}</div><strong>{value}</strong></div>;
}

function Panel({ title, subtitle, children, right }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function StepList({ items, empty = "No steps available." }) {
  if (!items?.length) return <p className="muted">{empty}</p>;
  return <ol className="steps">{items.map((s, i) => <li key={`${s}-${i}`}>{s}</li>)}</ol>;
}

function DataTable({ rows, columns, empty = "No data", onRowClick }) {
  if (!rows?.length) return <div className="empty">{empty}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i} onClick={() => onRowClick?.(r)}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [backendHealth, setBackendHealth] = useState("checking");
  const [dashboardSummary, setDashboardSummary] = useState({});
  const [tab, setTab] = useState("overview");

  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState("");
  const [issue, setIssue] = useState("");
  const [notes, setNotes] = useState("");

  const [consensus, setConsensus] = useState(DEFAULT_ANALYSIS);
  const [similarTickets, setSimilarTickets] = useState([]);
  const [trustedReferences, setTrustedReferences] = useState([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [consensusHistory, setConsensusHistory] = useState([]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [resolvedTask, setResolvedTask] = useState(null);
  const [runbook, setRunbook] = useState(null);
  const [safety, setSafety] = useState(null);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const automationTasks = useMemo(() => getAutomationCandidates(consensus), [consensus]);

  async function refreshAll() {
    try {
      const health = await getBackendHealth();
      setBackendHealth(health.status || "ok");
    } catch {
      setBackendHealth("offline");
    }

    try {
      const [summary, o, a, e, ch] = await Promise.all([
        getDashboardSummary(),
        getOutcomes(),
        getApprovalHistory(),
        getExecutionHistory(),
        getConsensusHistory()
      ]);
      setDashboardSummary(summary || {});
      setOutcomes(o || []);
      setApprovalHistory(a || []);
      setExecutionHistory(e || []);
      setConsensusHistory(ch || []);
    } catch (err) {
      console.warn(err);
    }
  }

  useEffect(() => { refreshAll(); }, []);

  async function handleSaveTicket() {
    setBusy("Saving ticket...");
    setError("");
    try {
      await createTicket({ title, requester, issue, notes });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleSearchEvidence() {
    setBusy("Searching evidence...");
    setError("");
    try {
      const q = [title, issue, notes].filter(Boolean).join(" ");
      const [similar, refs, docs] = await Promise.all([
        getSimilarTickets(q),
        searchReferences(q),
        searchKnowledge(q)
      ]);
      setSimilarTickets(similar || []);
      setTrustedReferences(refs || []);
      setKnowledgeDocs(docs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handlePreviewConsensus() {
    setBusy("Previewing consensus...");
    setError("");
    try {
      const result = await previewConsensus({ title, requester, issue, notes });
      const next = normalizeConsensus(result);
      setConsensus(next);
      setSelectedTask(null);
      setResolvedTask(null);
      setRunbook(null);
      setSafety(null);
      setTab("remediation");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleSaveOutcome() {
    setBusy("Saving outcome...");
    setError("");
    try {
      await createOutcome({
        ticket_summary: issue || title,
        requester,
        predicted_type: consensus.classification || "",
        approved_fix: consensus.recommended_fix,
        script_path: consensus.recommended_script,
        outcome: "saved",
        notes,
        gui_steps: consensus.gui_steps,
        powershell_steps: consensus.powershell_steps,
        step_by_step_remediation: consensus.step_by_step_remediation,
        validation_steps: consensus.validation_steps,
        rollback_steps: consensus.rollback_steps,
        reference_links: consensus.reference_links
      });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleApproveAndSave() {
    setBusy("Saving approval...");
    setError("");
    try {
      const payload = { title, requester, issue, approved: true, consensus, task: resolvedTask || selectedTask };
      await saveApprovalLog(payload);
      await saveConsensusDecision(payload);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handlePreviewRunbook(task = selectedTask) {
    if (!task) return;
    setBusy("Previewing runbook...");
    setError("");
    try {
      const rb = await previewRunbook({ runbook_id: task.runbook_id || task.id });
      setRunbook(rb.runbook);
      const safe = await evaluateRunbookSafety({ task, script: task.script || rb.runbook?.script, issue });
      setSafety(safe);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleExecuteRunbook() {
    const task = resolvedTask || selectedTask;
    if (!task) return;
    setBusy("Executing runbook...");
    setError("");
    try {
      const result = await executeRunbook({
        runbook_id: task.runbook_id || task.id,
        requester,
        issue,
        notes,
        approved
      });
      await refreshAll();
      alert(result.stdout || "Execution completed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function selectEvidence(row) {
    setTitle(row.ticket_summary || row.title || title);
    setIssue(row.ticket_summary || row.issue || issue);
    setNotes([row.notes, row.approved_fix].filter(Boolean).join("\n\n"));
    setConsensus(normalizeConsensus({
      ...row,
      recommended_fix: row.approved_fix || row.recommended_fix,
      recommended_script: row.script_path || row.recommended_script
    }));
    setTab("remediation");
  }

  function selectTask(task) {
    setSelectedTask(task);
    setResolvedTask(resolveAutomationTask({ task, issue, requester, title, notes, consensus }));
    handlePreviewRunbook(task);
  }

  const kpis = {
    backend: backendHealth,
    outcomes: dashboardSummary.outcomes_count ?? outcomes.length,
    approvals: dashboardSummary.approvals_count ?? approvalHistory.length,
    executions: dashboardSummary.executions_count ?? executionHistory.length,
    consensus: dashboardSummary.consensus_count ?? consensusHistory.length
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Helpdesk Copilot</h1>
          <p>Consensus-driven remediation and safe automation</p>
        </div>
        <div className="top-actions">
          <button onClick={handleSearchEvidence}>Refresh Evidence</button>
          <button className="primary" onClick={handlePreviewConsensus}>Preview Consensus</button>
        </div>
      </header>

      <div className="kpi-row">
        <KpiTile label="Backend" value={kpis.backend} tone={backendHealth === "ok" ? "good" : "warn"} />
        <KpiTile label="Outcomes" value={kpis.outcomes} />
        <KpiTile label="Approvals" value={kpis.approvals} />
        <KpiTile label="Executions" value={kpis.executions} />
        <KpiTile label="Consensus" value={kpis.consensus} />
      </div>

      {(busy || error) && <div className={error ? "status error" : "status"}>{error || busy}</div>}

      <main className="layout">
        <aside className="left-rail">
          <nav className="nav">
            {["overview", "evidence", "remediation", "automation", "history"].map((x) => (
              <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x}</button>
            ))}
          </nav>

          <Panel title="Issue Intake" subtitle="Describe the ticket">
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label>Requester<input value={requester} onChange={(e) => setRequester(e.target.value)} /></label>
            <label>Issue<textarea rows="6" value={issue} onChange={(e) => setIssue(e.target.value)} /></label>
            <label>Notes / Evidence<textarea rows="6" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            <div className="button-row">
              <button onClick={handleSaveTicket}>Save Ticket</button>
              <button onClick={handleSearchEvidence}>Search Evidence</button>
            </div>
          </Panel>
        </aside>

        <section className="center">
          {tab === "overview" && (
            <Panel title="Workspace Overview" subtitle="Start by entering a ticket, then search evidence or preview consensus.">
              <div className="grid2">
                <div className="soft-card"><h3>Recommended Fix</h3><p>{consensus.recommended_fix || "No consensus yet."}</p></div>
                <div className="soft-card"><h3>User Reply</h3><p>{consensus.user_reply || "No reply generated yet."}</p></div>
              </div>
            </Panel>
          )}

          {tab === "evidence" && (
            <div className="stack">
              <Panel title="Similar Tickets">
                <DataTable
                  rows={similarTickets}
                  onRowClick={selectEvidence}
                  columns={[
                    { key: "ticket_summary", label: "Issue", render: (r) => r.ticket_summary || r.title || "-" },
                    { key: "approved_fix", label: "Fix", render: (r) => r.approved_fix || "-" },
                    { key: "success_rate", label: "Success", render: (r) => `${r.success_rate || 0}%` }
                  ]}
                />
              </Panel>
              <Panel title="Trusted References">
                <DataTable
                  rows={trustedReferences}
                  onRowClick={selectEvidence}
                  columns={[
                    { key: "ticket_summary", label: "Reference", render: (r) => r.ticket_summary || "-" },
                    { key: "approved_fix", label: "Fix", render: (r) => r.approved_fix || "-" }
                  ]}
                />
              </Panel>
              <Panel title="Knowledge Matches">
                <DataTable
                  rows={knowledgeDocs}
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "tags", label: "Tags" },
                    { key: "source_file", label: "Source" }
                  ]}
                />
              </Panel>
            </div>
          )}

          {tab === "remediation" && (
            <div className="stack">
              <Panel title="Consensus Result" subtitle={consensus.classification || "Preview consensus to generate remediation."}
                right={<button onClick={handleSaveOutcome}>Save Outcome</button>}>
                <div className="grid2">
                  <div className="soft-card"><h3>Recommended Fix</h3><p>{consensus.recommended_fix || "-"}</p></div>
                  <div className="soft-card"><h3>Confidence</h3><p>{consensus.confidence || "-"}</p></div>
                </div>
              </Panel>
              <Panel title="GUI Steps"><StepList items={consensus.gui_steps} /></Panel>
              <Panel title="PowerShell Steps"><StepList items={consensus.powershell_steps} /></Panel>
              <Panel title="Validation Steps"><StepList items={consensus.validation_steps} /></Panel>
              <Panel title="Rollback Steps"><StepList items={consensus.rollback_steps} /></Panel>
              <Panel title="Suggested Script"><pre>{consensus.recommended_script || "No script suggested."}</pre></Panel>
            </div>
          )}

          {tab === "automation" && (
            <div className="stack">
              <Panel title="Automation Candidates">
                {automationTasks.length ? automationTasks.map((task) => (
                  <div className={`task ${selectedTask?.id === task.id ? "selected" : ""}`} key={task.id} onClick={() => selectTask(task)}>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <small>{task.type}</small>
                  </div>
                )) : <div className="empty">No automation candidates. Preview consensus first.</div>}
              </Panel>
              <Panel title="Runbook Preview">
                {runbook ? <><h3>{runbook.title}</h3><p>{runbook.description}</p><pre>{runbook.script}</pre></> : <p className="muted">Select an automation task.</p>}
                {safety ? <div className={`safety ${safety.decision}`}>Safety: {safety.decision} / Risk: {safety.risk_level}</div> : null}
                <label className="check"><input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} /> Approved to execute</label>
                <button className="primary" onClick={handleExecuteRunbook}>Execute Runbook</button>
              </Panel>
            </div>
          )}

          {tab === "history" && (
            <div className="stack">
              <Panel title="Outcomes">
                <DataTable rows={outcomes} columns={[
                  { key: "ticket_summary", label: "Issue" },
                  { key: "approved_fix", label: "Fix" },
                  { key: "success_rate", label: "Success", render: (r) => `${r.success_rate || 0}%` }
                ]} />
              </Panel>
              <Panel title="Approval History">
                <DataTable rows={approvalHistory} columns={[
                  { key: "created_at", label: "Time" },
                  { key: "title", label: "Title" },
                  { key: "approved", label: "Approved", render: (r) => r.approved ? "Yes" : "No" }
                ]} />
              </Panel>
              <Panel title="Execution History" right={<button onClick={async()=>{await clearExecutionHistory(); refreshAll();}}>Clear</button>}>
                <DataTable rows={executionHistory} columns={[
                  { key: "created_at", label: "Time" },
                  { key: "runbook_id", label: "Runbook" },
                  { key: "execution_status", label: "Status" },
                  { key: "stdout", label: "Output" }
                ]} />
              </Panel>
            </div>
          )}
        </section>

        <aside className="right-rail">
          <Panel title="Approval Controls">
            <button className="primary" onClick={handleApproveAndSave}>Approve + Save Consensus</button>
            <p className="muted">Approval history is stored in SQLite.</p>
          </Panel>
          <Panel title="Model Votes">
            <DataTable rows={consensus.model_votes || []} columns={[
              { key: "provider", label: "Provider" },
              { key: "recommended_fix", label: "Fix" },
              { key: "confidence", label: "Confidence" }
            ]} />
          </Panel>
          <Panel title="Knowledge Upload">
            <input type="file" onChange={async(e)=>{
              const file=e.target.files?.[0];
              if(!file) return;
              await uploadKnowledgeDocument({file,title:file.name,tags:""});
              await handleSearchEvidence();
            }} />
          </Panel>
        </aside>
      </main>
    </div>
  );
}
