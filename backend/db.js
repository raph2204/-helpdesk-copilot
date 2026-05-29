
import Database from "better-sqlite3";

export const db = new Database("helpdesk-copilot.db");
db.pragma("journal_mode = WAL");

function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      title TEXT,
      requester TEXT,
      issue TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ticket_summary TEXT,
      predicted_type TEXT,
      approved_fix TEXT,
      script_path TEXT,
      outcome TEXT,
      notes TEXT,
      requester TEXT,
      gui_steps TEXT,
      powershell_steps TEXT,
      step_by_step_remediation TEXT,
      validation_steps TEXT,
      rollback_steps TEXT,
      reference_links TEXT,
      usage_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      failure_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      title TEXT,
      requester TEXT,
      issue TEXT,
      approved INTEGER,
      consensus_json TEXT,
      task_json TEXT
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      requester TEXT,
      approved_by TEXT,
      task_id TEXT,
      runbook_id TEXT,
      risk_level TEXT,
      approved INTEGER,
      execution_status TEXT,
      stdout TEXT,
      stderr TEXT,
      exit_code INTEGER,
      notes TEXT,
      result_json TEXT
    );

    CREATE TABLE IF NOT EXISTS consensus_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      title TEXT,
      requester TEXT,
      issue TEXT,
      consensus_json TEXT
    );

    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      title TEXT,
      source_file TEXT,
      tags TEXT,
      content TEXT
    );
  `);

  for (const [col, def] of [
    ["gui_steps", "TEXT"],
    ["powershell_steps", "TEXT"],
    ["step_by_step_remediation", "TEXT"],
    ["validation_steps", "TEXT"],
    ["rollback_steps", "TEXT"],
    ["reference_links", "TEXT"],
    ["usage_count", "INTEGER DEFAULT 0"],
    ["success_count", "INTEGER DEFAULT 0"],
    ["failure_count", "INTEGER DEFAULT 0"]
  ]) {
    addColumnIfMissing("outcomes", col, def);
  }
}

export function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export function toJson(value) {
  return JSON.stringify(value ?? null);
}
