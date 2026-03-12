// IndexedDB-backed learning memory for patching workflows
// Database: OSC_AI_Memory, Stores: patch_learnings, patch_stats, osc_session_logs

export interface PatchWorkflowStep {
  step: number;
  action: string;
  status: "pending" | "sent" | "confirmed" | "validated" | "failed";
  sentAt?: number;
  confirmedAt?: number;
  error?: string;
}

export interface PatchWorkflowInput {
  channel: number;
  fixtureType: string;
  dmxAddress: number;
  universe: number;
  label: string;
}

export interface PatchWorkflow {
  id: string;
  type: "patch_workflow";
  timestamp: number;
  intent: "patch_channel";
  input: PatchWorkflowInput;
  steps: PatchWorkflowStep[];
  feedback: {
    console_echo: string | null;
    success: boolean;
    error: string | null;
  };
}

export interface OscLogEntry {
  timestamp: number;
  path: string;
  value?: string;
  consoleEcho?: string;
}

export interface OscSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  entries: OscLogEntry[];
  status: "recording" | "stopped";
}

export interface CorrectionRecord {
  error_id: string;
  original_command: string;
  console_response: string;
  likely_cause: string;
  correction_needed: string;
  timestamp: number;
}

export interface PatchStats {
  total_patches_attempted: number;
  successful_patches: number;
  failed_patches: number;
  total_osc_commands: number;
  total_sessions: number;
  common_errors: Array<{ error_text: string; count: number }>;
  learned_commands: Record<string, string>;
}

const DB_NAME = "OSC_AI_Memory";
const DB_VERSION = 2;
const LEARNINGS_STORE = "patch_learnings";
const STATS_STORE = "patch_stats";
const CORRECTIONS_STORE = "patch_corrections";
const SESSIONS_STORE = "osc_sessions";
const STATS_KEY = "global_stats";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LEARNINGS_STORE)) {
        db.createObjectStore(LEARNINGS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STATS_STORE)) {
        db.createObjectStore(STATS_STORE);
      }
      if (!db.objectStoreNames.contains(CORRECTIONS_STORE)) {
        db.createObjectStore(CORRECTIONS_STORE, { keyPath: "error_id" });
      }
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function uuid(): string {
  return `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Workflow CRUD ──

export function createPatchWorkflow(input: PatchWorkflowInput): PatchWorkflow {
  const steps: PatchWorkflowStep[] = [
    { step: 1, action: `/eos/set/patch/${input.channel}/type → ${input.fixtureType}`, status: "pending" },
    { step: 2, action: `/eos/set/patch/${input.channel}/address → ${input.dmxAddress}`, status: "pending" },
  ];
  if (input.label) {
    steps.push({ step: steps.length + 1, action: `/eos/set/patch/${input.channel}/label → ${input.label}`, status: "pending" });
  }

  return {
    id: uuid(),
    type: "patch_workflow",
    timestamp: Date.now(),
    intent: "patch_channel",
    input,
    steps,
    feedback: { console_echo: null, success: false, error: null },
  };
}

export function markStepSent(workflow: PatchWorkflow, stepNum: number): PatchWorkflow {
  return {
    ...workflow,
    steps: workflow.steps.map(s =>
      s.step === stepNum ? { ...s, status: "sent", sentAt: Date.now() } : s
    ),
  };
}

export function markStepValidated(workflow: PatchWorkflow, stepNum: number): PatchWorkflow {
  return {
    ...workflow,
    steps: workflow.steps.map(s =>
      s.step === stepNum ? { ...s, status: "validated" } : s
    ),
  };
}

export function markStepFailed(workflow: PatchWorkflow, stepNum: number, error: string): PatchWorkflow {
  return {
    ...workflow,
    steps: workflow.steps.map(s =>
      s.step === stepNum ? { ...s, status: "failed", error } : s
    ),
    feedback: { ...workflow.feedback, success: false, error },
  };
}

export function finalizeWorkflow(workflow: PatchWorkflow, success: boolean, consoleEcho: string | null, error: string | null): PatchWorkflow {
  return {
    ...workflow,
    feedback: { console_echo: consoleEcho, success, error },
  };
}

// ── OSC Session Recording ──

export function createSession(): OscSession {
  return {
    id: `ses-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    startedAt: Date.now(),
    entries: [],
    status: "recording",
  };
}

export function addSessionEntry(session: OscSession, path: string, value?: string, consoleEcho?: string): OscSession {
  return {
    ...session,
    entries: [...session.entries, { timestamp: Date.now(), path, value, consoleEcho }],
  };
}

export function stopSession(session: OscSession): OscSession {
  return { ...session, endedAt: Date.now(), status: "stopped" };
}

// ── Persistence ──

export async function saveWorkflow(workflow: PatchWorkflow): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEARNINGS_STORE, "readwrite");
    tx.objectStore(LEARNINGS_STORE).put(workflow);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveSession(session: OscSession): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    tx.objectStore(SESSIONS_STORE).put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadSessions(limit = 10): Promise<OscSession[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readonly");
    const req = tx.objectStore(SESSIONS_STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as OscSession[]).sort((a, b) => b.startedAt - a.startedAt);
      resolve(all.slice(0, limit));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function loadWorkflows(limit = 50): Promise<PatchWorkflow[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LEARNINGS_STORE, "readonly");
    const req = tx.objectStore(LEARNINGS_STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as PatchWorkflow[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(all.slice(0, limit));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([LEARNINGS_STORE, STATS_STORE, CORRECTIONS_STORE, SESSIONS_STORE], "readwrite");
    tx.objectStore(LEARNINGS_STORE).clear();
    tx.objectStore(STATS_STORE).clear();
    tx.objectStore(CORRECTIONS_STORE).clear();
    tx.objectStore(SESSIONS_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Stats ──

function defaultStats(): PatchStats {
  return {
    total_patches_attempted: 0,
    successful_patches: 0,
    failed_patches: 0,
    total_osc_commands: 0,
    total_sessions: 0,
    common_errors: [],
    learned_commands: {},
  };
}

export async function loadStats(): Promise<PatchStats> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STATS_STORE, "readonly");
    const req = tx.objectStore(STATS_STORE).get(STATS_KEY);
    req.onsuccess = () => resolve(req.result || defaultStats());
    req.onerror = () => reject(req.error);
  });
}

async function saveStats(stats: PatchStats): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STATS_STORE, "readwrite");
    tx.objectStore(STATS_STORE).put(stats, STATS_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function incrementOscCommandCount(count = 1): Promise<void> {
  const stats = await loadStats();
  stats.total_osc_commands += count;
  await saveStats(stats);
}

export async function incrementSessionCount(): Promise<void> {
  const stats = await loadStats();
  stats.total_sessions++;
  await saveStats(stats);
}

export async function updateStatsFromWorkflow(workflow: PatchWorkflow): Promise<PatchStats> {
  const stats = await loadStats();
  stats.total_patches_attempted++;
  if (workflow.feedback.success) {
    stats.successful_patches++;
    const key = `fixture_type_${workflow.input.fixtureType.toLowerCase().replace(/\s+/g, "_")}`;
    stats.learned_commands[key] = `Chan X Type ${workflow.input.fixtureType} Enter`;
  } else {
    stats.failed_patches++;
    if (workflow.feedback.error) {
      const existing = stats.common_errors.find(e => e.error_text === workflow.feedback.error);
      if (existing) {
        existing.count++;
      } else {
        stats.common_errors.push({ error_text: workflow.feedback.error, count: 1 });
      }
      stats.common_errors.sort((a, b) => b.count - a.count);
      if (stats.common_errors.length > 20) stats.common_errors.length = 20;
    }
  }
  await saveStats(stats);
  return stats;
}

// ── Corrections ──

export async function saveCorrection(correction: CorrectionRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CORRECTIONS_STORE, "readwrite");
    tx.objectStore(CORRECTIONS_STORE).put(correction);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadCorrections(): Promise<CorrectionRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CORRECTIONS_STORE, "readonly");
    const req = tx.objectStore(CORRECTIONS_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ── Export ──

export async function exportAllLearnings(): Promise<string> {
  const [workflows, stats, corrections, sessions] = await Promise.all([
    loadWorkflows(999),
    loadStats(),
    loadCorrections(),
    loadSessions(999),
  ]);
  return JSON.stringify({ workflows, stats, corrections, sessions, exportedAt: new Date().toISOString() }, null, 2);
}

// ── AI Prompt Injection ──

export async function buildLearningsPrompt(): Promise<string> {
  const stats = await loadStats();
  const corrections = await loadCorrections();

  const lines: string[] = [];
  if (Object.keys(stats.learned_commands).length > 0) {
    lines.push("Based on recorded patching learnings from this console, these commands are known to work:");
    for (const [key, cmd] of Object.entries(stats.learned_commands)) {
      lines.push(`  ${key}: "${cmd}"`);
    }
  }
  if (stats.common_errors.length > 0) {
    lines.push("\nThese errors have occurred and should be avoided:");
    for (const err of stats.common_errors.slice(0, 5)) {
      lines.push(`  - "${err.error_text}" (occurred ${err.count} time(s))`);
    }
  }
  if (corrections.length > 0) {
    lines.push("\nKnown corrections:");
    for (const c of corrections.slice(-5)) {
      lines.push(`  - Command "${c.original_command}" caused "${c.console_response}". Fix: ${c.correction_needed}`);
    }
  }
  return lines.length > 0 ? lines.join("\n") : "";
}
