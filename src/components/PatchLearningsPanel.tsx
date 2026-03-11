import { useState, useEffect, useCallback } from "react";
import {
  loadWorkflows,
  loadStats,
  loadSessions,
  clearAllData,
  exportAllLearnings,
  type PatchWorkflow,
  type PatchStats,
  type OscSession,
} from "@/lib/patchMemoryDb";

interface PatchLearningsPanelProps {
  refreshKey: number;
  isRecording: boolean;
  sessionEntryCount: number;
}

export default function PatchLearningsPanel({ refreshKey, isRecording, sessionEntryCount }: PatchLearningsPanelProps) {
  const [stats, setStats] = useState<PatchStats | null>(null);
  const [workflows, setWorkflows] = useState<PatchWorkflow[]>([]);
  const [sessions, setSessions] = useState<OscSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "sessions" | "patches">("live");

  const refresh = useCallback(async () => {
    const [s, w, sess] = await Promise.all([loadStats(), loadWorkflows(10), loadSessions(10)]);
    setStats(s);
    setWorkflows(w);
    setSessions(sess);
  }, []);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  const handleClear = async () => {
    await clearAllData();
    await refresh();
  };

  const handleExport = async () => {
    const json = await exportAllLearnings();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patch-learnings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const successRate = stats && stats.total_patches_attempted > 0
    ? Math.round((stats.successful_patches / stats.total_patches_attempted) * 100)
    : 0;

  const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
  const labelStyle: React.CSSProperties = { ...mono, fontSize: "9px", color: "#9ca3af", letterSpacing: "0.1em" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Recording indicator */}
      {isRecording && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 12px", borderRadius: "8px",
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
        }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#ef4444", animation: "pulse-ring 1s infinite",
          }} />
          <span style={{ ...mono, fontSize: "10px", color: "#ef4444", fontWeight: "700" }}>
            RECORDING
          </span>
          <span style={{ ...mono, fontSize: "10px", color: "#9ca3af", marginLeft: "auto" }}>
            {sessionEntryCount} cmds
          </span>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: "flex", gap: "8px" }}>
        <StatBox label="COMMANDS" value={stats?.total_osc_commands ?? 0} color="#6b7280" />
        <StatBox label="SESSIONS" value={stats?.total_sessions ?? 0} color="#3b82f6" />
        <StatBox label="PATCHES" value={stats?.total_patches_attempted ?? 0} color="#FF6B2B" />
        <StatBox label="RATE" value={`${successRate}%`} color="#22c55e" />
      </div>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: "4px" }}>
        {(["live", "sessions", "patches"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "5px 8px", borderRadius: "6px",
              border: `1px solid ${tab === t ? "#8b5cf6" : "#e5e7eb"}`,
              background: tab === t ? "rgba(139,92,246,0.08)" : "#fff",
              ...mono, fontSize: "9px", fontWeight: "700",
              color: tab === t ? "#8b5cf6" : "#9ca3af",
              cursor: "pointer", letterSpacing: "0.05em",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "live" && (
        <>
          {/* Common Errors */}
          {stats && stats.common_errors.length > 0 && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "8px", padding: "10px 14px",
            }}>
              <div style={{ ...labelStyle, color: "#ef4444", marginBottom: "6px" }}>COMMON ERRORS</div>
              {stats.common_errors.slice(0, 3).map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ ...mono, fontSize: "10px", color: "#991b1b" }}>{e.error_text}</span>
                  <span style={{ ...mono, fontSize: "9px", color: "#b91c1c" }}>×{e.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Learned Commands */}
          {stats && Object.keys(stats.learned_commands).length > 0 && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: "8px", padding: "10px 14px",
            }}>
              <div style={{ ...labelStyle, color: "#22c55e", marginBottom: "6px" }}>LEARNED COMMANDS</div>
              {Object.entries(stats.learned_commands).slice(0, 5).map(([key, cmd]) => (
                <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "2px" }}>
                  <span style={{ ...mono, fontSize: "9px", color: "#6b7280", width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {key}
                  </span>
                  <span style={{ ...mono, fontSize: "10px", color: "#166534" }}>{cmd}</span>
                </div>
              ))}
            </div>
          )}

          {(stats?.total_osc_commands === 0 && stats?.total_patches_attempted === 0) && (
            <div style={{ ...mono, fontSize: "11px", color: "#d1d5db", textAlign: "center", padding: "20px" }}>
              Hit RECORD, then use any OSC command — it'll be captured here
            </div>
          )}
        </>
      )}

      {tab === "sessions" && (
        <div>
          {sessions.length === 0 && (
            <div style={{ ...mono, fontSize: "11px", color: "#d1d5db", textAlign: "center", padding: "16px" }}>
              No sessions recorded yet
            </div>
          )}
          {sessions.map(ses => (
            <div
              key={ses.id}
              onClick={() => setExpandedId(expandedId === ses.id ? null : ses.id)}
              style={{
                background: "#fff",
                border: `1px solid ${ses.status === "recording" ? "rgba(239,68,68,0.3)" : "#e5e7eb"}`,
                borderRadius: "8px", padding: "8px 12px", marginBottom: "6px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: ses.status === "recording" ? "#ef4444" : "#22c55e",
                }} />
                <span style={{ ...mono, fontSize: "10px", color: "#1f2937", flex: 1 }}>
                  {ses.entries.length} commands
                </span>
                <span style={{ ...mono, fontSize: "9px", color: "#9ca3af" }}>
                  {new Date(ses.startedAt).toLocaleTimeString("en-GB", { hour12: false })}
                </span>
              </div>
              {expandedId === ses.id && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f3f4f6", maxHeight: "200px", overflowY: "auto" }}>
                  {ses.entries.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ ...mono, fontSize: "9px", color: "#9ca3af", flexShrink: 0 }}>
                        {new Date(e.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
                      </span>
                      <span style={{ ...mono, fontSize: "10px", color: "#FF6B2B" }}>{e.path}</span>
                      {e.value && <span style={{ ...mono, fontSize: "10px", color: "#3b82f6" }}>[{e.value}]</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "patches" && (
        <div>
          {workflows.length === 0 && (
            <div style={{ ...mono, fontSize: "11px", color: "#d1d5db", textAlign: "center", padding: "16px" }}>
              No patch workflows recorded yet
            </div>
          )}
          {workflows.map(wf => (
            <div
              key={wf.id}
              onClick={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
              style={{
                background: "#fff",
                border: `1px solid ${wf.feedback.success ? "#bbf7d0" : wf.feedback.error ? "#fecaca" : "#e5e7eb"}`,
                borderRadius: "8px", padding: "8px 12px", marginBottom: "6px", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: wf.feedback.success ? "#22c55e" : wf.feedback.error ? "#ef4444" : "#f59e0b",
                }} />
                <span style={{ ...mono, fontSize: "10px", color: "#1f2937", flex: 1 }}>
                  Ch {wf.input.channel} → {wf.input.fixtureType}
                </span>
                <span style={{ ...mono, fontSize: "9px", color: "#9ca3af" }}>
                  {new Date(wf.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
                </span>
              </div>
              {expandedId === wf.id && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
                  {wf.steps.map(s => (
                    <div key={s.step} style={{ display: "flex", gap: "8px", marginBottom: "3px", alignItems: "center" }}>
                      <span style={{
                        ...mono, fontSize: "9px", width: "18px", textAlign: "center",
                        color: s.status === "validated" ? "#22c55e" : s.status === "failed" ? "#ef4444" : "#9ca3af",
                      }}>
                        {s.status === "validated" ? "✓" : s.status === "failed" ? "✕" : s.status === "sent" ? "→" : "○"}
                      </span>
                      <span style={{ ...mono, fontSize: "10px", color: "#4b5563" }}>{s.action}</span>
                    </div>
                  ))}
                  {wf.feedback.error && (
                    <div style={{ ...mono, fontSize: "10px", color: "#ef4444", marginTop: "4px" }}>
                      Error: {wf.feedback.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleExport} style={{
          flex: 1, padding: "7px", borderRadius: "7px",
          border: "1px solid #e5e7eb", background: "#fff",
          ...mono, fontSize: "9px", fontWeight: "700",
          color: "#6b7280", cursor: "pointer", letterSpacing: "0.05em",
        }}>
          EXPORT
        </button>
        <button onClick={handleClear} style={{
          flex: 1, padding: "7px", borderRadius: "7px",
          border: "1px solid #fecaca", background: "#fff",
          ...mono, fontSize: "9px", fontWeight: "700",
          color: "#ef4444", cursor: "pointer", letterSpacing: "0.05em",
        }}>
          CLEAR
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb",
      borderRadius: "8px", padding: "6px 8px", textAlign: "center",
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: "16px",
        fontWeight: "700", color, lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: "7px",
        color: "#9ca3af", letterSpacing: "0.1em", marginTop: "3px",
      }}>
        {label}
      </div>
    </div>
  );
}
