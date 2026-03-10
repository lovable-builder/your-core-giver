// Update this page (the content is just a fallback if you fail to update the page)
import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";

import ConsoleSteps3D from "@/components/ConsoleSteps3D";
import VoiceMicButton from "@/components/VoiceMicButton";
import VoiceAgent from "@/components/VoiceAgent";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const CONSOLES = [
  { id: "eos-ti", name: "Eos Ti", desc: "Flagship", color: "#FF6B2B" },
  { id: "ion-xe", name: "Ion Xe", desc: "Mid-size", color: "#FF8C42" },
  { id: "element2", name: "Element 2", desc: "Compact", color: "#FFA559" },
  { id: "nomad", name: "Nomad", desc: "Software", color: "#FFB347" },
  { id: "colorsource", name: "ColorSource", desc: "Entry", color: "#FFC27A" },
];

const OSC_TABS = ["Channels", "Cues", "Effects", "Patching", "Groups", "Palettes", "Macros", "System"];

const OSC_COMMANDS = {
  Channels: [
    { label: "Select", path: "/eos/newcmd", value: "Chan {a} Enter", params: ["Channel"] },
    { label: "Intensity", path: "/eos/chan/{a}/param/intensity", value: "{b}", params: ["Channel", "Level 0–100"], isFloat: true },
    { label: "Full", path: "/eos/newcmd", value: "Chan {a} Full Enter", params: ["Channel"] },
    { label: "Out", path: "/eos/newcmd", value: "Chan {a} Out Enter", params: ["Channel"] },
    { label: "Range", path: "/eos/newcmd", value: "Chan {a} Thru {b} At {c} Enter", params: ["From", "To", "Level"] },
    { label: "Sneak", path: "/eos/newcmd", value: "Chan {a} Sneak Enter", params: ["Channel"] },
  ],
  Cues: [
    { label: "Go", path: "/eos/key/go", params: [], isKey: true },
    { label: "Back", path: "/eos/key/back", params: [], isKey: true },
    { label: "Fire Cue", path: "/eos/cue/{a}/fire", params: ["Cue #"], isKey: true },
    { label: "Record", path: "/eos/newcmd", value: "Cue {a} Record Enter", params: ["Cue #"] },
    { label: "Update", path: "/eos/newcmd", value: "Cue {a} Update Enter", params: ["Cue #"] },
    { label: "Delete", path: "/eos/newcmd", value: "Cue {a} Delete Enter Enter", params: ["Cue #"] },
    { label: "Label", path: "/eos/newcmd", value: "Cue {a} Label {b} Enter", params: ["Cue #", "Label"] },
    { label: "Time", path: "/eos/newcmd", value: "Cue {a} Time {b} Enter", params: ["Cue #", "Seconds"] },
  ],
  Effects: [
    { label: "Apply", path: "/eos/newcmd", value: "Chan {a} Effect {b} Enter", params: ["Channel", "Effect #"] },
    { label: "Rate", path: "/eos/newcmd", value: "Effect {a} Rate {b} Enter", params: ["Effect #", "Rate 0–200"] },
    { label: "Size", path: "/eos/newcmd", value: "Effect {a} Size {b} Enter", params: ["Effect #", "Size 0–100"] },
    { label: "Offset", path: "/eos/newcmd", value: "Effect {a} Offset {b} Enter", params: ["Effect #", "Offset 0–360"] },
    { label: "Stop", path: "/eos/newcmd", value: "Chan {a} Effect Stop Enter", params: ["Channel"] },
    { label: "Record FX", path: "/eos/newcmd", value: "Effect {a} Record Enter", params: ["Effect #"] },
  ],
  Patching: [
    { label: "Patch Mode", path: "/eos/key/patch", params: [], isKey: true },
    { label: "Address", path: "/eos/newcmd", value: "Chan {a} Address {b} Enter", params: ["Channel", "DMX Addr"] },
    { label: "Unpatch", path: "/eos/newcmd", value: "Chan {a} Address 0 Enter", params: ["Channel"] },
    { label: "Universe", path: "/eos/newcmd", value: "Chan {a} Address {b}/{c} Enter", params: ["Chan", "Universe", "Addr"] },
  ],
  Groups: [
    { label: "Select", path: "/eos/newcmd", value: "Group {a} Enter", params: ["Group #"] },
    { label: "At Level", path: "/eos/newcmd", value: "Group {a} At {b} Enter", params: ["Group #", "Level 0–100"] },
    { label: "Record", path: "/eos/newcmd", value: "Group {a} Record Enter", params: ["Group #"] },
    { label: "Delete", path: "/eos/newcmd", value: "Group {a} Delete Enter", params: ["Group #"] },
  ],
  Palettes: [
    { label: "Color", path: "/eos/newcmd", value: "Color Palette {a} Enter", params: ["Palette #"] },
    { label: "Intensity", path: "/eos/newcmd", value: "Intensity Palette {a} Enter", params: ["Palette #"] },
    { label: "Focus", path: "/eos/newcmd", value: "Focus Palette {a} Enter", params: ["Palette #"] },
    { label: "Beam", path: "/eos/newcmd", value: "Beam Palette {a} Enter", params: ["Palette #"] },
    { label: "Rec Color", path: "/eos/newcmd", value: "Color Palette {a} Record Enter", params: ["Palette #"] },
    { label: "Update", path: "/eos/newcmd", value: "Color Palette {a} Update Enter", params: ["Palette #"] },
  ],
  Macros: [
    { label: "Fire", path: "/eos/macro/{a}/fire", params: ["Macro #"], isKey: true },
    { label: "Record", path: "/eos/newcmd", value: "Macro {a} Record Enter", params: ["Macro #"] },
    { label: "Stop", path: "/eos/newcmd", value: "Macro {a} Stop Enter", params: ["Macro #"] },
    { label: "Delete", path: "/eos/newcmd", value: "Macro {a} Delete Enter", params: ["Macro #"] },
  ],
  System: [
    { label: "Undo", path: "/eos/newcmd", value: "Undo Enter", params: [] },
    { label: "Clear", path: "/eos/key/clear", params: [], isKey: true },
    { label: "Highlight", path: "/eos/key/highlight", params: [], isKey: true },
    { label: "Blind", path: "/eos/key/blind", params: [], isKey: true },
    { label: "Live", path: "/eos/key/live", params: [], isKey: true },
    { label: "Stage", path: "/eos/key/stage", params: [], isKey: true },
    { label: "Park", path: "/eos/key/park", params: [], isKey: true },
    { label: "Assert", path: "/eos/key/assert", params: [], isKey: true },
  ],
};

const QUICK_ACTIONS = [
  { label: "GO", path: "/eos/key/go", color: "#22c55e" },
  { label: "BACK", path: "/eos/key/back", color: "#3b82f6" },
  { label: "CLEAR", path: "/eos/key/clear", color: "#f97316" },
  { label: "UNDO", path: "/eos/newcmd", value: "Undo Enter", color: "#8b5cf6" },
  { label: "BLIND", path: "/eos/key/blind", color: "#ec4899" },
  { label: "LIVE", path: "/eos/key/live", color: "#10b981" },
  { label: "FULL", path: "/eos/newcmd", value: "Full Enter", color: "#f59e0b" },
  { label: "OUT", path: "/eos/newcmd", value: "Out Enter", color: "#6b7280" },
];

const STEP_COLORS = {
  mode: "#FF6B2B",
  keypad: "#3B82F6",
  command: "#8B5CF6",
  record: "#EF4444",
  confirm: "#10B981",
  soft: "#EAB308",
};

// ── PARTICLES BACKGROUND ───────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.6 ? "#00ffc8" : Math.random() > 0.5 ? "#FF6B2B" : "#ffffff",
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle =
          p.color +
          Math.floor(p.alpha * 255)
            .toString(16)
            .padStart(2, "0");
        ctx.fill();
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach((q) => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,255,200,${0.06 * (1 - d / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.6 }} />
  );
}

// ── SPECTRUM VISUALIZER ────────────────────────────────────────────────────────
function SpectrumBar({ active }) {
  const bars = 24;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "32px" }}>
      {Array.from({ length: bars }, (_, i) => {
        const h = active ? Math.random() * 28 + 4 : Math.sin((i / bars) * Math.PI) * 14 + 4;
        return (
          <div
            key={i}
            style={{
              width: "3px",
              height: `${h}px`,
              background: `hsl(${20 + i * 3}, 90%, ${55 + i}%)`,
              borderRadius: "1px",
              animation: active ? `bar-dance ${0.3 + Math.random() * 0.4}s ease-in-out infinite alternate` : "none",
              transition: "height 0.15s ease",
            }}
          />
        );
      })}
    </div>
  );
}

// ── GLOW BUTTON ────────────────────────────────────────────────────────────────
function GlowButton({ children, onClick, color = "#FF6B2B", active = false, disabled = false, style = {} }: { active?: any; children: any; color?: string; disabled?: any; onClick: any; style?: any }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        position: "relative",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? color : "transparent",
        color: active ? "#000" : color,
        fontFamily: "'Space Mono', monospace",
        fontWeight: "700",
        fontSize: "11px",
        letterSpacing: "0.1em",
        padding: "8px 16px",
        borderRadius: "6px",
        boxShadow: active ? `0 0 20px ${color}88, 0 0 40px ${color}44` : `inset 0 0 0 1px ${color}44`,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)",
        opacity: disabled ? 0.3 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── CONSOLE STEP CARD ──────────────────────────────────────────────────────────
function StepCard({ step, index, isActive, total, onClick }) {
  const color = step.color || "#FF6B2B";
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        background: isActive ? `${color}11` : "rgba(255,255,255,0.02)",
        border: `1px solid ${isActive ? color : "rgba(255,255,255,0.06)"}`,
        borderRadius: "10px",
        padding: "14px 16px",
        marginBottom: "8px",
        transform: isActive ? "translateX(4px)" : "translateX(0)",
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: isActive ? `0 0 24px ${color}33, inset 0 0 24px ${color}08` : "none",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "60%",
            background: color,
            borderRadius: "0 2px 2px 0",
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            flexShrink: 0,
            background: isActive ? color : "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: "700",
            color: isActive ? "#000" : "#555",
            fontFamily: "'Space Mono', monospace",
            boxShadow: isActive ? `0 0 12px ${color}88` : "none",
            transition: "all 0.3s",
          }}
        >
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                fontWeight: "700",
                color: isActive ? color : "#888",
                background: isActive ? `${color}22` : "transparent",
                padding: isActive ? "2px 10px" : "2px 0",
                borderRadius: "4px",
                transition: "all 0.3s",
                letterSpacing: "0.05em",
              }}
            >
              {step.button}
            </span>
            <span style={{ fontSize: "10px", color: "#444", fontFamily: "'Space Mono', monospace" }}>{step.zone}</span>
            {isActive && (
              <span
                style={{ marginLeft: "auto", fontSize: "10px", color: "#333", fontFamily: "'Space Mono', monospace" }}
              >
                {index + 1}/{total}
              </span>
            )}
          </div>
          {isActive && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "12px",
                color: "#aaa",
                lineHeight: "1.6",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {step.desc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── OSC COMMAND CARD ───────────────────────────────────────────────────────────
function OscCard({ cmd, onSend }: { cmd: any; onSend: (path: string, value?: string | number | null) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [fired, setFired] = useState(false);

  // Build display path: for newcmd show the command string, for others show the resolved path
  const resolvedPath = cmd.path === "/eos/newcmd"
    ? `/eos/newcmd → "${(cmd.value || "").replace("{a}", vals.a || "…").replace("{b}", vals.b || "…").replace("{c}", vals.c || "…")}"`
    : cmd.path.replace("{a}", vals.a || "…").replace("{b}", vals.b || "…").replace("{c}", vals.c || "…");

  const handleSend = () => {
    if (cmd.isKey && !cmd.value) {
      // Key press or macro fire — resolve path with params, no value
      const resolvedKeyPath = cmd.path.replace("{a}", vals.a || "").replace("{b}", vals.b || "");
      onSend(resolvedKeyPath);
    } else if (cmd.path === "/eos/newcmd") {
      // newcmd — send path + command string as value
      const cmdStr = (cmd.value || "").replace("{a}", vals.a || "").replace("{b}", vals.b || "").replace("{c}", vals.c || "");
      onSend("/eos/newcmd", cmdStr);
    } else if (cmd.isFloat) {
      // Direct param path — resolve path and send float value
      const resolvedParamPath = cmd.path.replace("{a}", vals.a || "1");
      const floatVal = parseFloat((cmd.value || "").replace("{b}", vals.b || "0").replace("{a}", vals.a || "0"));
      onSend(resolvedParamPath, isNaN(floatVal) ? 0 : floatVal);
    } else {
      const resolvedP = cmd.path.replace("{a}", vals.a || "").replace("{b}", vals.b || "").replace("{c}", vals.c || "");
      onSend(resolvedP, vals.a || null);
    }
    setFired(true);
    setTimeout(() => setFired(false), 600);
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "10px",
        padding: "12px 14px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,107,43,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: cmd.params.length ? "10px" : "0" }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            fontWeight: "700",
            color: "#FF6B2B",
            flex: 1,
          }}
        >
          {cmd.label.toUpperCase()}
        </span>
        <button
          onClick={handleSend}
          style={{
            padding: "5px 14px",
            borderRadius: "5px",
            border: "none",
            background: fired ? "#22c55e" : "#FF6B2B",
            color: "#000",
            fontFamily: "'Space Mono', monospace",
            fontSize: "10px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: fired ? "0 0 12px #22c55e88" : "0 0 8px #FF6B2B44",
            transform: fired ? "scale(0.95)" : "scale(1)",
          }}
        >
          {fired ? "✓" : "SEND"}
        </button>
      </div>
      {cmd.params.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {cmd.params.map((p, i) => {
            const key = ["a", "b", "c"][i];
            return (
              <input
                key={i}
                value={vals[key] || ""}
                onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
                placeholder={p}
                style={{
                  flex: 1,
                  minWidth: "60px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "5px",
                  padding: "5px 10px",
                  color: "#ddd",
                  fontSize: "11px",
                  fontFamily: "'Space Mono', monospace",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#FF6B2B88")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            );
          })}
        </div>
      )}
      <div
        style={{
          marginTop: "6px",
          fontSize: "9px",
          color: "#333",
          fontFamily: "'Space Mono', monospace",
          wordBreak: "break-all",
        }}
      >
        {resolvedPath}
      </div>
    </div>
  );
}

// ── FIXTURE VISUALIZER ─────────────────────────────────────────────────────────
function FixtureGrid({ channels }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gap: "6px",
      }}
    >
      {channels.map((ch, i) => (
        <div
          key={i}
          title={`Ch ${ch.id}: ${ch.intensity}%`}
          style={{
            aspectRatio: "1",
            borderRadius: "6px",
            position: "relative",
            overflow: "hidden",
            background: `rgba(${Math.floor(ch.r)},${Math.floor(ch.g)},${Math.floor(ch.b)},0.15)`,
            border: `1px solid rgba(${Math.floor(ch.r)},${Math.floor(ch.g)},${Math.floor(ch.b)},0.4)`,
            cursor: "pointer",
            transition: "all 0.3s",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${ch.intensity}%`,
              background: `rgba(${Math.floor(ch.r)},${Math.floor(ch.g)},${Math.floor(ch.b)},0.7)`,
              transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)",
              boxShadow:
                ch.intensity > 0
                  ? `0 0 10px rgba(${Math.floor(ch.r)},${Math.floor(ch.g)},${Math.floor(ch.b)},0.5)`
                  : "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "2px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: "8px",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {ch.id}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CUE STACK ─────────────────────────────────────────────────────────────────
function CueStack({ cues, activeCue, onGo, isLive = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {isLive && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px",
          padding: "4px 10px", borderRadius: "6px",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
        }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", animation: "pulse-ring 2s infinite" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#22c55e", letterSpacing: "0.1em" }}>
            LIVE FROM CONSOLE — {cues.length} CUES
          </span>
        </div>
      )}
      {cues.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px", color: "#333", fontFamily: "'Space Mono', monospace", fontSize: "11px" }}>
          No cues loaded. Click IMPORT CUES to sync from console.
        </div>
      )}
      {cues.map((cue, i) => (
        <div
          key={cue.id + "-" + i}
          onClick={() => onGo(cue)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "7px",
            background: activeCue === cue.id ? "rgba(255,107,43,0.15)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${activeCue === cue.id ? "rgba(255,107,43,0.5)" : "rgba(255,255,255,0.05)"}`,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: activeCue === cue.id ? "0 0 16px rgba(255,107,43,0.2)" : "none",
          }}
        >
          <div
            style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: activeCue === cue.id ? "#FF6B2B" : "#333",
              flexShrink: 0,
              boxShadow: activeCue === cue.id ? "0 0 8px #FF6B2B" : "none",
            }}
          />
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: "11px",
            color: activeCue === cue.id ? "#FF6B2B" : "#666", width: "44px",
          }}>
            {cue.id}
          </span>
          <span style={{
            flex: 1, fontSize: "12px",
            color: activeCue === cue.id ? "#e0e0e0" : "#555",
            fontFamily: "'DM Sans', sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {cue.label || "—"}
          </span>
          {cue.upTime != null && (
            <span style={{ fontSize: "9px", color: "#3b82f6", fontFamily: "'Space Mono', monospace" }}>
              ↑{cue.upTime}s
            </span>
          )}
          {cue.downTime != null && (
            <span style={{ fontSize: "9px", color: "#8b5cf6", fontFamily: "'Space Mono', monospace" }}>
              ↓{cue.downTime}s
            </span>
          )}
          <span style={{ fontSize: "10px", color: "#444", fontFamily: "'Space Mono', monospace" }}>{cue.time}s</span>
        </div>
      ))}
    </div>
  );
}

// ── COMMAND LOG ────────────────────────────────────────────────────────────────
function CommandLog({ logs, onClear }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span
          style={{ fontSize: "10px", color: "#444", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em" }}
        >
          OSC LOG
        </span>
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            color: "#333",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          CLEAR
        </button>
      </div>
      <div
        ref={ref}
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#050505",
          borderRadius: "8px",
          padding: "10px",
          minHeight: "120px",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {logs.length === 0 && (
          <span style={{ color: "#1a1a1a", fontSize: "11px", fontFamily: "'Space Mono', monospace" }}>
            // awaiting commands...
          </span>
        )}
        {logs.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px", alignItems: "baseline" }}>
            <span style={{ color: "#2a2a2a", fontSize: "10px", fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
              {l.time}
            </span>
            <span style={{ fontSize: "10px", color: "#22c55e", fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
              →
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#FF6B2B88",
                fontFamily: "'Space Mono', monospace",
                wordBreak: "break-all",
              }}
            >
              {l.path}
            </span>
            {l.val && (
              <span style={{ fontSize: "10px", color: "#3b82f688", fontFamily: "'Space Mono', monospace" }}>
                [{l.val}]
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState("guide");
  const [mounted, setMounted] = useState(false);

  // Guide state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedConsole, setSelectedConsole] = useState(null);
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState(() => localStorage.getItem("elevenlabs_agent_id") || "");
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [steps, setSteps] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showConsoleSelect, setShowConsoleSelect] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // OSC state
  const [oscHost, setOscHost] = useState(() => localStorage.getItem("eos_osc_host") || "192.168.0.15");
  const [oscPort, setOscPort] = useState(() => {
    const saved = localStorage.getItem("eos_osc_port");
    // Migrate stale default: 3033 was the bridge RX port, not the console TX port
    if (saved === "3033") { localStorage.setItem("eos_osc_port", "3032"); return "3032"; }
    return saved || "3032";
  });

  // Persist target values
  useEffect(() => { localStorage.setItem("eos_osc_host", oscHost); }, [oscHost]);
  useEffect(() => { localStorage.setItem("eos_osc_port", oscPort); }, [oscPort]);
  const [oscTab, setOscTab] = useState("Channels");
  const [oscLogs, setOscLogs] = useState([]);
  const [customPath, setCustomPath] = useState("");
  const [customVal, setCustomVal] = useState("");
  
  // AI OSC state
  const [aiOscInput, setAiOscInput] = useState("");
  const [aiOscLoading, setAiOscLoading] = useState(false);
  const [aiOscHistory, setAiOscHistory] = useState<Array<{
    role: "user" | "assistant";
    text: string;
    commands?: Array<{ path: string; value?: string; description: string }>;
  }>>([]);
  const [aiOscPreviewMode, setAiOscPreviewMode] = useState(false);

  // WebSocket bridge state
  const [bridgeUrl, setBridgeUrl] = useState(() => localStorage.getItem("eos_bridge_url") || import.meta.env.VITE_BRIDGE_URL || "ws://localhost:8080");
  const BRIDGE_URL = bridgeUrl;
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [lastMsg, setLastMsg] = useState("");

  // Console feedback state
  const [consoleFeedback, setConsoleFeedback] = useState<{
    activeCue: string | null;
    commandLine: string;
    channelCount: number;
    consoleOnline: boolean;
    lastPong: number | null;
  }>({
    activeCue: null,
    commandLine: "",
    channelCount: 0,
    consoleOnline: false,
    lastPong: null,
  });
  const [consolePatch, setConsolePatch] = useState<Array<{
    channel: number;
    universe: number;
    address: number;
    fixture?: string;
    label?: string;
  }>>([]);

  // ── Message buffer for throttled processing ──
  const msgBufferRef = useRef<any[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushMessages = useCallback(() => {
    const batch = msgBufferRef.current;
    msgBufferRef.current = [];
    if (batch.length === 0) return;

    // Update count once for entire batch
    setMsgCount(c => c + batch.length);

    // Find last meaningful message label
    const lastLabel = batch.reduce((acc, d) => `${d.type || "?"}${d.subtype ? "/" + d.subtype : ""}`, "");
    setLastMsg(lastLabel);

    // Accumulate state changes, apply once
    let feedbackUpdate: Record<string, any> = {};
    let newActiveCue: string | null = null;
    let channelUpdates: any[] = [];
    let patchUpdates: any[] = [];
    let cueUpdates: any[] = [];
    let cuePropertyUpdates: any[] = [];
    let subUpdates: any[] = [];
    let commandLineText: string | null = null;
    let cuesLiveFlag = false;

    for (const data of batch) {
      if (!data.type) continue;

      switch (data.type) {
        case "console_feedback": {
          feedbackUpdate.consoleOnline = true;

          // Only update commandLine from explicit command_line subtypes
          if (data.subtype === "command_line" && data.text != null) {
            commandLineText = data.text;
          }

          if (data.channel_count != null) {
            feedbackUpdate.channelCount = data.channel_count;
          }

          // Guard active cue: only from explicit active_cue subtype
          if (data.subtype === "active_cue" && data.active_cue != null) {
            newActiveCue = String(data.active_cue);
          }

          if (data.subtype === "channel_intensity" && data.channels) {
            channelUpdates.push(...data.channels);
          }

          if (data.subtype === "patch" || data.subtype === "patch_complete") {
            const pd = Array.isArray(data.patch) ? data.patch : [];
            if (pd.length > 0) {
              patchUpdates.push(...pd);
            }
          }

          if (data.subtype === "sub") {
            const subs = Array.isArray(data.submasters)
              ? data.submasters
              : Array.isArray(data.subs)
                ? data.subs
                : Array.isArray(data.data)
                  ? data.data
                  : [];
            if (subs.length > 0) subUpdates.push(...subs);
          }

          if (data.subtype === "cue_data") {
            cuesLiveFlag = true;
            cueUpdates.push(data);
          }

          if (data.subtype === "cue_complete" && Array.isArray(data.cues)) {
            cuesLiveFlag = true;
            // Replace entire cue list with the complete batch
            cueUpdates = data.cues.map((c: any) => ({
              ...c,
              cue_number: c.cue_number ?? c.id,
              label: c.label ?? "",
              up_time: c.up_time ?? c.upTime,
              down_time: c.down_time ?? c.downTime,
            }));
          }

          if (data.subtype === "cue_property") {
            cuesLiveFlag = true;
            cuePropertyUpdates.push(data);
          }
          break;
        }
        case "active_cue": {
          const cue = data.cue ?? data.value;
          if (cue != null) newActiveCue = String(cue);
          break;
        }
        case "channel_intensity": {
          if (data.channels) channelUpdates.push(...data.channels);
          break;
        }
        case "patch":
        case "patch_complete": {
          const pd = Array.isArray(data.patch)
            ? data.patch
            : Array.isArray(data.data)
              ? data.data
              : [];
          if (pd.length) {
            patchUpdates.push(...pd);
          }
          break;
        }
        case "pong": {
          feedbackUpdate.consoleOnline = true;
          feedbackUpdate.lastPong = Date.now();
          break;
        }
        case "command_line": {
          commandLineText = data.text ?? data.value ?? "";
          break;
        }
        default:
          break;
      }
    }

    // Apply accumulated state in minimal updates
    if (Object.keys(feedbackUpdate).length > 0 || commandLineText !== null || newActiveCue !== null) {
      setConsoleFeedback(prev => ({
        ...prev,
        ...feedbackUpdate,
        ...(commandLineText !== null ? { commandLine: commandLineText } : {}),
        ...(newActiveCue !== null ? { activeCue: newActiveCue } : {}),
      }));
    }

    if (newActiveCue !== null) {
      setActiveCue(prev => prev === newActiveCue ? prev : newActiveCue!);
    }

    if (channelUpdates.length > 0) {
      setChannels(prev => {
        const updated = [...prev];
        channelUpdates.forEach((ch: any) => {
          const chId = ch.id ?? ch.channel;
          const idx = updated.findIndex(c => c.id === chId);
          const entry = {
            id: chId,
            intensity: ch.intensity ?? ch.level ?? 0,
            r: ch.r ?? 255,
            g: ch.g ?? 180,
            b: ch.b ?? 80,
          };
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], ...entry };
          } else {
            updated.push(entry);
            updated.sort((a, b) => a.id - b.id);
          }
        });
        return updated;
      });
    }

    if (patchUpdates.length > 0) {
      const incoming = patchUpdates
        .map((p: any) => ({
          channel: Number(p.channel ?? p.chan),
          universe: Number(p.universe ?? p.uni ?? 1),
          address: Number(p.dmxAddress ?? p.address ?? p.addr ?? p.dmx),
          fixture: p.fixture_type ?? p.fixture ?? p.type ?? "",
          label: p.notes ?? p.label ?? "",
        }))
        .filter((p: any) => Number.isFinite(p.channel) && p.channel > 0);

      setConsolePatch(prev => {
        const next = new Map<number, any>();
        prev.forEach((p) => next.set(p.channel, p));
        incoming.forEach((p: any) => next.set(p.channel, p));
        return Array.from(next.values()).sort((a, b) => a.channel - b.channel);
      });

      if (incoming.length > 0) {
        setChannels(prev => {
          const byId = new Map(prev.map((c) => [c.id, c]));
          incoming.forEach((p: any) => {
            if (!byId.has(p.channel)) {
              byId.set(p.channel, { id: p.channel, intensity: 0, r: 255, g: 180, b: 80 });
            }
          });
          return Array.from(byId.values()).sort((a, b) => a.id - b.id);
        });
      }
    }

    if (subUpdates.length > 0) {
      const parsedSubs = subUpdates
        .map((s: any, i: number) => {
          const index = Number(s.index ?? s.sub ?? s.id ?? i + 1);
          if (!Number.isFinite(index) || index < 1) return null;
          const rawLevel = Number(s.level ?? s.value ?? s.intensity ?? 0);
          const level = rawLevel <= 1 ? Math.round(rawLevel * 100) : Math.round(rawLevel);
          return {
            index,
            level: Math.max(0, Math.min(100, level)),
            label: String(s.label ?? s.name ?? `Sub ${index}`),
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.index - b.index);

      if (parsedSubs.length > 0) {
        setFaderVals(parsedSubs.map((s: any) => s.level));
        setFaderLabels(parsedSubs.map((s: any) => s.label));
      }
    }

    if (cuesLiveFlag) setCuesLive(true);
    if (cueUpdates.length > 0) {
      setCues(prev => {
        let newCues = [...prev];
        for (const data of cueUpdates) {
          const existing = newCues.find(c => c.id === data.cue_number);
          const cueEntry = {
            id: data.cue_number,
            label: data.label || existing?.label || "",
            time: data.up_time != null ? String(data.up_time) : (existing?.time || "0"),
            upTime: data.up_time,
            downTime: data.down_time,
          };
          if (existing) {
            newCues = newCues.map(c => c.id === data.cue_number ? { ...c, ...cueEntry } : c);
          } else {
            newCues.push(cueEntry);
          }
        }
        newCues.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
        return newCues;
      });
    }

    if (cuePropertyUpdates.length > 0) {
      setCues(prev => {
        let newCues = [...prev];
        for (const data of cuePropertyUpdates) {
          const cueId = String(data.cue_number ?? data.cue ?? "").trim();
          if (!cueId) continue;

          const existingIndex = newCues.findIndex(c => c.id === cueId);
          if (existingIndex === -1) {
            newCues.push({ id: cueId, label: "", time: "0", upTime: null, downTime: null });
          }

          newCues = newCues.map(c => {
            if (c.id !== cueId) return c;
            if (data.property === "label") return { ...c, label: String(data.value || "") };
            if (data.property === "duration" || data.property === "up") {
              return { ...c, time: String(data.value ?? c.time), upTime: data.value };
            }
            if (data.property === "down") return { ...c, downTime: data.value };
            return c;
          });
        }
        newCues.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
        return newCues;
      });
    }
  }, []);

  // Handler for incoming bridge messages — buffers and flushes every 150ms
  const handleBridgeMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      msgBufferRef.current.push(data);

      // Schedule flush if not already pending
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          flushMessages();
        }, 150);
      }
    } catch {
      // not JSON or unrecognized — ignore
    }
  }, [flushMessages]);

  // Send typed message to bridge
  const sendBridgeMessage = useCallback((msg: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ...msg, host: oscHost, port: parseInt(oscPort, 10) }));
    }
  }, [oscHost, oscPort]);

  // WebSocket connection effect
  useEffect(() => {
    let disposed = false;
    const connect = () => {
      if (disposed) return;
      try {
        const ws = new WebSocket(BRIDGE_URL);
        wsRef.current = ws;
        ws.onopen = () => { if (!disposed) setWsConnected(true); };
        ws.onmessage = handleBridgeMessage;
        ws.onclose = () => {
          if (!disposed) {
            setWsConnected(false);
            setConsoleFeedback(prev => ({ ...prev, consoleOnline: false }));
            wsReconnectRef.current = setTimeout(connect, 3000);
          }
        };
        ws.onerror = () => { ws.close(); };
      } catch {
        if (!disposed) wsReconnectRef.current = setTimeout(connect, 3000);
      }
    };
    connect();
    return () => {
      disposed = true;
      if (wsReconnectRef.current) clearTimeout(wsReconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [BRIDGE_URL, handleBridgeMessage]);

  // Polling: ping + levels only. Patch is manual or on-connect only.
  useEffect(() => {
    if (!wsConnected) return;

    // Prime immediate fetch
    sendBridgeMessage({ type: "ping" });
    sendBridgeMessage({ type: "request_levels" });
    sendBridgeMessage({ type: "request_patch" });
    sendBridgeMessage({ type: "request_cues" });

    const fastPoll = setInterval(() => {
      sendBridgeMessage({ type: "ping" });
      sendBridgeMessage({ type: "request_levels" });
    }, 3000);

    // Cues only, no more automatic patch polling
    const slowPoll = setInterval(() => {
      sendBridgeMessage({ type: "request_cues" });
    }, 30000);

    return () => {
      clearInterval(fastPoll);
      clearInterval(slowPoll);
    };
  }, [wsConnected, sendBridgeMessage]);

  // Live state
  const [channels, setChannels] = useState<Array<{ id: number; intensity: number; r: number; g: number; b: number }>>([]);
  const [cues, setCues] = useState<Array<{ id: string; label: string; time: string; upTime: string | null; downTime: string | null }>>([]);
  const [cuesLive, setCuesLive] = useState(false);
  const [activeCue, setActiveCue] = useState(null);
  const [specActive, setSpecActive] = useState(false);
  const [faderVals, setFaderVals] = useState<number[]>([]);
  const [faderLabels, setFaderLabels] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    // Boot message — always show console select on start
    setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          text: "ETC Console AI online. Which console do you need help with?",
          type: "console-select",
        },
      ]);
      setShowConsoleSelect(true);
    }, 400);
    return () => {};
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Send an OSC message via the bridge.
  // For /eos/newcmd: value is the command string (e.g. "Cue 5 Go Enter")
  // For /eos/key/*: no value needed
  // For /eos/chan/*/param/*: value is a float
  // For /eos/sub/*/level: value is float 0.0-1.0
  // For /eos/macro/*/fire: no value needed
  const sendOsc = useCallback((path: string, value?: string | number | null) => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
    const displayVal = value != null ? String(value) : "";
    setOscLogs((prev) => [...prev.slice(-99), { time, path, val: displayVal }]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // For /eos/newcmd commands: send as /eos/newcmd with command string as typed arg
      // Bridge will forward to EOS as /eos/user/X/newcmd + string argument
      if (path === "/eos/newcmd" && typeof value === "string" && value.length > 0) {
        wsRef.current.send(JSON.stringify({
          path: "/eos/newcmd",
          args: [{ type: "s", value }],
          host: oscHost,
          port: parseInt(oscPort, 10),
        }));
        return;
      }

      // Build proper typed args per EOS spec
      let args: Array<{type: string; value: string | number}> = [];
      if (value != null && value !== "") {
        if (typeof value === "number" || (!isNaN(Number(value)) && path.includes("/param/"))) {
          args = [{ type: "f", value: parseFloat(String(value)) }];
        } else if (typeof value === "string") {
          args = [{ type: "s", value }];
        }
      }
      wsRef.current.send(JSON.stringify({ path, args, host: oscHost, port: parseInt(oscPort, 10) }));
    }
  }, [oscHost, oscPort]);

  // Execute AI OSC commands — with preset macro interception
  const executeAiOscCommands = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setAiOscLoading(true);
    setAiOscHistory(prev => [...prev, { role: "user", text: prompt }]);
    
    try {
      // Step 4: Voice macro — intercept preset commands before calling AI
      const presetMatch = prompt.match(/^(?:apply|patch|use)\s+(.+)$/i);
      if (presetMatch) {
        const { findPresetByName } = await import("@/components/PatchPresets");
        const preset = findPresetByName(presetMatch[1]);
        if (preset) {
          // Build patch commands directly from preset — skip AI entirely
          const commands: Array<{ path: string; value?: string; description: string }> = [
            { path: "/eos/key/patch", description: "Enter patch mode" },
          ];
          for (let i = 0; i < preset.quantity; i++) {
            const ch = preset.startChannel + i;
            const addr = preset.startDmxAddress + i * preset.modeChannels;
            commands.push({
              path: "/eos/newcmd",
              value: `Chan ${ch} Address ${preset.universe}/${addr} Enter`,
              description: `Patch ch ${ch} → DMX ${preset.universe}/${addr}`,
            });
          }
          commands.push({ path: "/eos/key/live", description: "Return to live mode" });
          
          setAiOscHistory(prev => [...prev, {
            role: "assistant",
            text: `Applying preset "${preset.name}" — ${preset.quantity} fixture(s)`,
            commands,
          }]);
          
          // Execute with 200ms stagger, 400ms for mode switches
          for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const isModeSwitchCmd = cmd.path === "/eos/key/patch" || cmd.path === "/eos/key/live";
            if (i > 0) await new Promise(resolve => setTimeout(resolve, isModeSwitchCmd ? 400 : 200));
            sendOsc(cmd.path, cmd.value);
          }
          
          setAiOscLoading(false);
          setAiOscInput("");
          return;
        }
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/osc-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            prompt, 
            consoleName: selectedConsole?.name || "Unknown",
            context: {
              activeCue: consoleFeedback.activeCue,
              consoleOnline: consoleFeedback.consoleOnline,
              channelCount: consoleFeedback.channelCount,
            }
          }),
        }
      );
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const commands = data.commands || [];
      
      setAiOscHistory(prev => [...prev, { 
        role: "assistant", 
        text: `Generated ${commands.length} command(s)`, 
        commands 
      }]);
      
      // Patch-mode safety net: detect patch-related newcmd values and wrap with /eos/key/patch + /eos/key/live
      const patchPattern = /\b(Address|Type|Unpatch)\b/i;
      const hasPatchCommands = commands.some((cmd: any) => 
        cmd.path === "/eos/newcmd" && patchPattern.test(cmd.value || "")
      );
      const alreadyHasPatchKey = commands.some((cmd: any) => cmd.path === "/eos/key/patch");
      
      let finalCommands = commands;
      if (hasPatchCommands && !alreadyHasPatchKey) {
        finalCommands = [
          { path: "/eos/key/patch", description: "Enter patch mode" },
          ...commands,
          { path: "/eos/key/live", description: "Return to live mode" },
        ];
      }
      
      // Step 6: Optimized delays — 400ms for mode switches, 200ms for inner commands
      for (let i = 0; i < finalCommands.length; i++) {
        const cmd = finalCommands[i];
        if (i > 0) {
          const isModeSwitchCmd = cmd.path === "/eos/key/patch" || cmd.path === "/eos/key/live";
          const prevIsModeSwitchCmd = finalCommands[i - 1].path === "/eos/key/patch" || finalCommands[i - 1].path === "/eos/key/live";
          const delay = (isModeSwitchCmd || prevIsModeSwitchCmd) ? 400 : 200;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        sendOsc(cmd.path, cmd.value);
      }
      
    } catch (err: any) {
      console.error("AI OSC error:", err);
      setAiOscHistory(prev => [...prev, { 
        role: "assistant", 
        text: `Error: ${err.message}` 
      }]);
    } finally {
      setAiOscLoading(false);
      setAiOscInput("");
    }
  }, [selectedConsole, consoleFeedback, sendOsc]);

  const handleQuickAction = (action: any) => {
    if (action.value) {
      sendOsc(action.path, action.value);
    } else {
      sendOsc(action.path);
    }
    if (action.label === "GO" && activeCue === null) setActiveCue("1");
  };

  const fetchSteps = async (prompt: string, consoleName: string) => {
    setLoading(true);
    setSteps(null);
    setActiveStep(0);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/console-guide`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, consoleName }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const parsed = data.steps;
      setSteps(parsed);
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "loading"),
        {
          role: "assistant",
          text: `Here's your ${consoleName} guide for "${prompt}" — ${parsed.length} steps.`,
        },
      ]);
    } catch (err: any) {
      console.error("fetchSteps error:", err);
      const fallback = [
        { button: "LIVE", zone: "Mode Keys", color: "#FF6B2B", desc: "Ensure you're in Live mode." },
        { button: "CUE", zone: "Keypad", color: "#3B82F6", desc: "Press CUE to begin cue command." },
        { button: "[Number]", zone: "Numeric Keypad", color: "#8B5CF6", desc: "Enter the cue number." },
        { button: "RECORD", zone: "Record Group", color: "#EF4444", desc: "Press RECORD to capture." },
        { button: "ENTER", zone: "Keypad", color: "#10B981", desc: "Confirm to save." },
      ];
      setSteps(fallback);
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "loading"),
        {
          role: "assistant",
          text: `Guide ready for "${prompt}" on ${consoleName}. (Using fallback — ${err.message})`,
        },
      ]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: txt }]);
    // Always ask which console before generating a guide
    setPendingPrompt(txt);
    setShowConsoleSelect(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: "Which console are you working with?", type: "console-select" },
    ]);
  };

  const handleConsoleSelect = async (con) => {
    setSelectedConsole(con);
    setShowConsoleSelect(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: con.name },
      {
        role: "assistant",
        text: `${con.name} locked in. Generating your guide...`,
        type: "loading",
      },
    ]);
    await fetchSteps(pendingPrompt, con.name);
    setPendingPrompt(null);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="scanlines cyber-grid"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020208 0%, #060610 30%, #0a0812 100%)",
        fontFamily: "'DM Sans', sans-serif",
        color: "#e0e0e0",
        overflow: "hidden auto",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=Orbitron:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,200,0.2); border-radius: 2px; }
        @keyframes bar-dance { from { transform: scaleY(0.4); } to { transform: scaleY(1.2); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0,255,200,0.4); } 70% { box-shadow: 0 0 0 10px rgba(0,255,200,0); } 100% { box-shadow: 0 0 0 0 rgba(0,255,200,0); } }
        @keyframes shimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .nav-btn { transition: all 0.2s; position: relative; overflow: hidden; }
        .nav-btn:hover { color: #00ffc8 !important; text-shadow: 0 0 12px rgba(0,255,200,0.5); }
        .nav-btn::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #00ffc8, transparent); opacity: 0; transition: opacity 0.3s; }
        .nav-btn:hover::after { opacity: 1; }
        .msg-in { animation: fadeUp 0.3s ease forwards; }
      `}</style>

      <ParticleField />

      {/* ── HEADER ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(2,2,8,0.9)",
          backdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(0,255,200,0.08)",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          gap: "0",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginRight: "32px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #FF6B2B 0%, #00ffc8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(0,255,200,0.3), 0 0 48px rgba(255,107,43,0.2)",
              fontSize: "18px",
              flexShrink: 0,
              animation: "hex-rotate 20s linear infinite",
            }}
          >
            ⚡
          </div>
          <div>
            <div
              className="holo-text"
              style={{
                fontFamily: "'Orbitron', 'Space Mono', monospace",
                fontWeight: "900",
                fontSize: "14px",
                letterSpacing: "0.12em",
              }}
            >
              EOS<span>AI</span>
            </div>
            <div
              style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "#00ffc866", letterSpacing: "0.2em" }}
            >
              CONSOLE INTELLIGENCE v2.0
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: "4px", flex: 1 }}>
          {[
            { id: "guide", label: "AI GUIDE", icon: "◈" },
            { id: "osc", label: "OSC CONTROL", icon: "⊕" },
          ].map((tab) => (
            <button
              key={tab.id}
              className="nav-btn"
              onClick={() => setActiveModule(tab.id)}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                background: activeModule === tab.id ? "rgba(0,255,200,0.08)" : "transparent",
                color: activeModule === tab.id ? "#00ffc8" : "#555",
                fontFamily: "'Orbitron', 'Space Mono', monospace",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                cursor: "pointer",
                boxShadow: activeModule === tab.id ? "inset 0 0 0 1px rgba(0,255,200,0.2), 0 0 16px rgba(0,255,200,0.1)" : "none",
                textShadow: activeModule === tab.id ? "0 0 8px rgba(0,255,200,0.5)" : "none",
              }}
            >
              <span style={{ marginRight: "6px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* WebSocket Bridge Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 14px",
              borderRadius: "20px",
              background: wsConnected ? "rgba(0,255,200,0.08)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${wsConnected ? "rgba(0,255,200,0.3)" : "rgba(239,68,68,0.2)"}`,
              cursor: "pointer",
              transition: "all 0.4s ease",
              boxShadow: wsConnected
                ? "0 0 12px rgba(0,255,200,0.25), 0 0 24px rgba(0,255,200,0.1), inset 0 0 8px rgba(0,255,200,0.05)"
                : "none",
            }}
            title={wsConnected ? `Connected to ${BRIDGE_URL}` : `Disconnected — trying ${BRIDGE_URL}`}
            onClick={() => window.open("/bridge.js", "_blank")}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: wsConnected ? "#00ffc8" : "#ef4444",
                boxShadow: wsConnected ? "0 0 6px #00ffc8" : "none",
                transition: "all 0.4s ease",
              }}
            />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: wsConnected ? "#00ffc8" : "#ef4444", transition: "color 0.3s" }}>
              {wsConnected ? "BRIDGE ONLINE" : "OFFLINE"}
            </span>
            {wsConnected && (
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "rgba(0,255,200,0.5)", marginLeft: "4px" }}>
                {msgCount > 0 ? `${msgCount} msgs` : "0 msgs"}
              </span>
            )}
          </div>
          {selectedConsole && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(255,107,43,0.1)",
                border: "1px solid rgba(255,107,43,0.2)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse-ring 2s infinite",
                }}
              />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "#FF6B2B" }}>
                {selectedConsole.name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 20px",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {/* ══ MODULE: AI GUIDE ══ */}
        {activeModule === "guide" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
            {/* Chat Panel */}
            <div
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              }}
            >
              {/* Panel Header */}
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(255,107,43,0.03)",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 8px #22c55e",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "10px",
                    color: "#666",
                    letterSpacing: "0.12em",
                  }}
                >
                  AI CONSOLE GUIDE
                </span>
                {loading && (
                  <div style={{ marginLeft: "auto", display: "flex", gap: "3px" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          background: "#FF6B2B",
                          animation: `shimmer 1s ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div
                ref={chatRef}
                style={{
                  height: "340px",
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="msg-in"
                    style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
                  >
                    <div
                      style={{
                        maxWidth: "82%",
                        background:
                          msg.role === "user"
                            ? "linear-gradient(135deg, rgba(255,107,43,0.2), rgba(255,61,0,0.15))"
                            : "rgba(255,255,255,0.04)",
                        border: `1px solid ${msg.role === "user" ? "rgba(255,107,43,0.3)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                        padding: "10px 14px",
                        fontSize: "13px",
                        lineHeight: "1.6",
                        color: msg.role === "user" ? "#ffd0b5" : "#bbb",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {msg.type === "loading" ? (
                        <span style={{ color: "#444" }}>
                          thinking<span style={{ animation: "shimmer 1s infinite" }}>...</span>
                        </span>
                      ) : msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}

                {/* Console selector pills */}
                {showConsoleSelect && (
                  <div className="msg-in" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {CONSOLES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleConsoleSelect(c)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          background: "rgba(255,107,43,0.08)",
                          border: "1px solid rgba(255,107,43,0.3)",
                          color: "#FF6B2B",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "11px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,107,43,0.2)";
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,107,43,0.08)";
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Console badge */}
              {selectedConsole && (
                <div
                  style={{
                    padding: "8px 18px",
                    borderTop: "1px solid rgba(255,255,255,0.03)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "#555" }}>
                    CONSOLE: <span style={{ color: selectedConsole.color }}>{selectedConsole.name.toUpperCase()}</span>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedConsole(null);
                      setShowConsoleSelect(false);
                    }}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      color: "#333",
                      cursor: "pointer",
                      fontSize: "10px",
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    CHANGE
                  </button>
                </div>
              )}

              {/* Input */}
              <div
                style={{
                  padding: "14px 16px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="e.g. How do I build an effects chase?"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#e0e0e0",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,43,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    width: "42px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      loading || !input.trim() ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #FF6B2B, #FF3D00)",
                    color: loading || !input.trim() ? "#333" : "#fff",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    boxShadow: !loading && input.trim() ? "0 0 16px rgba(255,107,43,0.4)" : "none",
                  }}
                >
                  →
                </button>
                <VoiceAgent
                  agentId={elevenLabsAgentId}
                  onTranscript={(text, speaker) => {
                    setMessages((prev) => [
                      ...prev,
                      { role: speaker === "user" ? "user" : "assistant", text },
                    ]);
                  }}
                />
              </div>
              {/* Agent ID config */}
              {!elevenLabsAgentId && (
                <div style={{
                  padding: "8px 16px 12px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                }}>
                  <input
                    placeholder="ElevenLabs Agent ID"
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      color: "#e0e0e0",
                      fontSize: "11px",
                      fontFamily: "'Space Mono', monospace",
                      outline: "none",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          setElevenLabsAgentId(val);
                          localStorage.setItem("elevenlabs_agent_id", val);
                        }
                      }
                    }}
                  />
                  <span style={{ fontSize: "10px", color: "#666", fontFamily: "'Space Mono', monospace" }}>
                    Press Enter to save
                  </span>
                </div>
              )}
            </div>

            {/* Steps Panel */}
            <div
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(255,107,43,0.03)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "10px",
                    color: "#666",
                    letterSpacing: "0.12em",
                    flex: 1,
                  }}
                >
                  BUTTON SEQUENCE
                </span>
                {steps && (
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "#444" }}>
                    {activeStep + 1} / {steps.length}
                  </span>
                )}
              </div>

              <div style={{ padding: "16px", minHeight: "340px" }}>
                {!steps && (
                  <div
                    style={{
                      height: "300px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      color: "#1e1e1e",
                    }}
                  >
                    <div style={{ fontSize: "48px", opacity: 0.3 }}>◈</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.1em" }}>
                      ASK ANYTHING TO BEGIN
                    </div>
                  </div>
                )}
                {steps && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <ConsoleSteps3D
                      steps={steps}
                      activeIndex={activeStep}
                      onActiveIndexChange={setActiveStep}
                      height={260}
                      className="rounded-xl"
                    />

                    {/* Active step info (keeps the descriptive text you had under each button) */}
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(0,0,0,0.22)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#666" }}>
                        {(steps[activeStep]?.zone || "").toUpperCase()}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#cfcfcf" }}>
                        {steps[activeStep]?.desc}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {steps && (
                <div
                  style={{
                    padding: "14px 16px",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <GlowButton
                    onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                    disabled={activeStep === 0}
                    style={{ flex: 1 }}
                  >
                    ← PREV
                  </GlowButton>
                  <GlowButton
                    onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}
                    disabled={activeStep === steps.length - 1}
                    active
                    style={{ flex: 1 }}
                  >
                    NEXT →
                  </GlowButton>
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            <div style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "#2a2a2a",
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.1em",
                  marginBottom: "10px",
                }}
              >
                SUGGESTED TASKS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  "Record a cue with fade time",
                  "Create a colour chase effect",
                  "Patch a moving head fixture",
                  "Set up submaster faders",
                  "Record a group of channels",
                  "Apply a focus palette",
                  "Build an effects sequence",
                  "Configure MIDI triggers",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s);
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#444",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,43,0.4)";
                      (e.currentTarget as HTMLElement).style.color = "#FF6B2B";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLElement).style.color = "#444";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ MODULE: OSC CONTROL ══ */}
        {activeModule === "osc" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Connection Bar */}
            <div
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px #22c55e",
                  animation: "pulse-ring 2s infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                  color: "#444",
                  letterSpacing: "0.1em",
                }}
              >
                TARGET
              </span>
              <input
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                placeholder="ws://localhost:8080"
                style={{
                  width: "200px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  color: "#ddd",
                  fontSize: "12px",
                  fontFamily: "'Space Mono', monospace",
                  outline: "none",
                }}
              />
              {[
                { val: oscHost, set: setOscHost, placeholder: "Console IP", width: "150px" },
                { val: oscPort, set: setOscPort, placeholder: "3033", width: "70px" },
              ].map((f, i) => (
                <input
                  key={i}
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{
                    width: f.width,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    color: "#ddd",
                    fontSize: "12px",
                    fontFamily: "'Space Mono', monospace",
                    outline: "none",
                  }}
                />
              ))}
              <button
                onClick={() => {
                  localStorage.setItem("eos_osc_host", oscHost);
                  localStorage.setItem("eos_osc_port", oscPort);
                  localStorage.setItem("eos_bridge_url", bridgeUrl);
                  // Reconnect WebSocket with new bridge URL
                  if (wsRef.current) { wsRef.current.close(); }
                }}
                style={{
                  padding: "6px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#FF6B2B",
                  color: "#000",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "10px",
                  fontWeight: "700",
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                SAVE
              </button>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "#2a2a2a" }}>
                Bridge: {bridgeUrl} → {oscHost}:{oscPort}
              </span>

              {/* Quick Actions */}
              <div style={{ marginLeft: "auto", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      sendOsc(a.path);
                      setSpecActive(true);
                      setTimeout(() => setSpecActive(false), 300);
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "5px",
                      border: `1px solid ${a.color}44`,
                      background: `${a.color}11`,
                      color: a.color,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "10px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      letterSpacing: "0.05em",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = `${a.color}33`;
                      e.currentTarget.style.boxShadow = `0 0 12px ${a.color}44`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = `${a.color}11`;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── AI AGENT PROMPT BAR ── */}
            <div
              className="neon-panel"
              style={{
                background: "rgba(0,255,200,0.02)",
                border: "1px solid rgba(0,255,200,0.12)",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>🤖</span>
                <span style={{ fontFamily: "'Orbitron', 'Space Mono', monospace", fontSize: "10px", color: "#00ffc8", letterSpacing: "0.12em", flex: 1 }}>
                  AI OSC AGENT — VOICE & TEXT TO CONSOLE
                </span>
                {/* Preview mode toggle */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                  onClick={() => setAiOscPreviewMode(p => !p)}
                >
                  <div
                    style={{
                      width: "32px", height: "16px", borderRadius: "8px",
                      background: aiOscPreviewMode ? "rgba(255,107,43,0.6)" : "rgba(255,255,255,0.08)",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: "2px",
                      left: aiOscPreviewMode ? "18px" : "2px",
                      width: "12px", height: "12px", borderRadius: "50%",
                      background: aiOscPreviewMode ? "#FF6B2B" : "#444",
                      transition: "left 0.2s",
                    }} />
                  </div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#444" }}>
                    PREVIEW
                  </span>
                </div>
              </div>

              {/* Chat history */}
              {aiOscHistory.length > 0 && (
                <div
                  style={{
                    maxHeight: "200px", overflowY: "auto",
                    display: "flex", flexDirection: "column", gap: "8px",
                    background: "rgba(0,0,0,0.3)", borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  {aiOscHistory.map((msg, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <span style={{
                          fontFamily: "'Space Mono', monospace", fontSize: "9px",
                          color: msg.role === "user" ? "#3b82f6" : "#FF6B2B",
                          flexShrink: 0, marginTop: "1px",
                        }}>
                          {msg.role === "user" ? "YOU" : "AI"}
                        </span>
                        <span style={{ fontSize: "12px", color: msg.role === "user" ? "#aaa" : "#e0e0e0", fontFamily: "'DM Sans', sans-serif" }}>
                          {msg.text}
                        </span>
                      </div>
                      {/* Command preview cards */}
                      {msg.commands && msg.commands.length > 0 && (
                        <div style={{ paddingLeft: "30px", display: "flex", flexDirection: "column", gap: "3px" }}>
                          {msg.commands.map((cmd, ci) => (
                            <div key={ci} style={{
                              display: "flex", alignItems: "center", gap: "8px",
                              background: "rgba(255,107,43,0.05)", borderRadius: "6px",
                              padding: "4px 10px",
                            }}>
                              <span style={{ fontSize: "9px", color: "#22c55e", fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>✓</span>
                              <span style={{ fontSize: "10px", color: "#FF6B2B88", fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                                {cmd.path}
                              </span>
                              {cmd.value && (
                                <span style={{ fontSize: "10px", color: "#3b82f688", fontFamily: "'Space Mono', monospace" }}>
                                  [{cmd.value}]
                                </span>
                              )}
                              <span style={{ fontSize: "10px", color: "#555", fontFamily: "'DM Sans', sans-serif", flex: 1 }}>
                                — {cmd.description}
                              </span>
                              {/* In preview mode allow manual fire */}
                              {aiOscPreviewMode && msg === aiOscHistory[aiOscHistory.length - 1] && (
                                <button
                                  onClick={() => sendOsc(cmd.path, cmd.value)}
                                  style={{
                                    padding: "2px 8px", borderRadius: "4px",
                                    border: "1px solid rgba(255,107,43,0.3)",
                                    background: "rgba(255,107,43,0.1)",
                                    color: "#FF6B2B", fontSize: "9px",
                                    fontFamily: "'Space Mono', monospace",
                                    cursor: "pointer",
                                  }}
                                >
                                  FIRE
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {aiOscLoading && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#FF6B2B" }}>AI</span>
                      <span style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Sans', sans-serif" }}>Thinking...</span>
                      <div style={{ display: "flex", gap: "3px" }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{
                            width: "4px", height: "4px", borderRadius: "50%",
                            background: "#FF6B2B",
                            animation: `pulse-ring 1.2s ${i * 0.2}s infinite`,
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input row */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  value={aiOscInput}
                  onChange={(e) => setAiOscInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !aiOscLoading && aiOscInput.trim()) {
                      executeAiOscCommands(aiOscInput);
                    }
                  }}
                  placeholder='Try: "Set channels 1-5 to full", "Apply Front House Rig", "Fire cue 3"...'
                  disabled={aiOscLoading}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(0,255,200,0.15)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#e0e0e0",
                    fontSize: "13px",
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(0,255,200,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(0,255,200,0.15)")}
                />
                <button
                  onClick={() => { if (!aiOscLoading && aiOscInput.trim()) executeAiOscCommands(aiOscInput); }}
                  disabled={aiOscLoading || !aiOscInput.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: aiOscLoading || !aiOscInput.trim()
                      ? "rgba(255,255,255,0.04)"
                      : "linear-gradient(135deg, #FF6B2B, #00ffc8)",
                    color: aiOscLoading || !aiOscInput.trim() ? "#333" : "#000",
                    fontFamily: "'Orbitron', 'Space Mono', monospace",
                    fontSize: "10px",
                    fontWeight: "700",
                    cursor: aiOscLoading || !aiOscInput.trim() ? "not-allowed" : "pointer",
                    letterSpacing: "0.08em",
                    boxShadow: !aiOscLoading && aiOscInput.trim() ? "0 0 20px rgba(0,255,200,0.3)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {aiOscLoading ? "..." : aiOscPreviewMode ? "PREVIEW" : "EXECUTE"}
                </button>
                {/* Voice-to-OSC Mic Button (Web Speech API) */}
                <VoiceMicButton
                  onResult={(text) => {
                    setAiOscInput(text);
                    executeAiOscCommands(text);
                  }}
                  disabled={aiOscLoading}
                />
                {aiOscHistory.length > 0 && (
                  <button
                    onClick={() => setAiOscHistory([])}
                    style={{
                      padding: "10px 12px", borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "transparent", color: "#333",
                      fontFamily: "'Space Mono', monospace", fontSize: "9px",
                      cursor: "pointer",
                    }}
                  >
                    CLR
                  </button>
                )}
              </div>

              {/* Quick suggestions */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  "Set channel 1 to full",
                  "Fire cue 1",
                  "Blackout stage",
                  "Go to next cue",
                  "Set channels 1-10 to 50%",
                  "Undo last action",
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => { setAiOscInput(s); }}
                    style={{
                      padding: "4px 12px", borderRadius: "16px",
                      background: "transparent",
                      border: "1px solid rgba(255,107,43,0.12)",
                      color: "#555", fontFamily: "'DM Sans', sans-serif",
                      fontSize: "11px", cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,43,0.4)";
                      (e.currentTarget as HTMLElement).style.color = "#FF6B2B";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,43,0.12)";
                      (e.currentTarget as HTMLElement).style.color = "#555";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "16px" }}>
              {/* Command Tabs */}
              <div
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                {/* Tab Bar */}
                <div
                  style={{
                    display: "flex",
                    gap: "2px",
                    padding: "10px 10px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    overflowX: "auto",
                  }}
                >
                  {OSC_TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setOscTab(t)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px 8px 0 0",
                        border: "none",
                        borderBottom: oscTab === t ? "2px solid #FF6B2B" : "2px solid transparent",
                        background: oscTab === t ? "rgba(255,107,43,0.1)" : "transparent",
                        color: oscTab === t ? "#FF6B2B" : "#444",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "10px",
                        fontWeight: "700",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Commands Grid */}
                <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {OSC_COMMANDS[oscTab].map((cmd, i) => (
                    <OscCard key={i} cmd={cmd} onSend={sendOsc} />
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Custom OSC */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#444",
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.1em",
                      marginBottom: "12px",
                    }}
                  >
                    CUSTOM COMMAND
                  </div>
                  <input
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="/eos/chan/1/param/intensity"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "7px",
                      padding: "9px 12px",
                      color: "#ddd",
                      fontSize: "12px",
                      fontFamily: "'Space Mono', monospace",
                      outline: "none",
                      marginBottom: "8px",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,43,0.4)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={customVal}
                      onChange={(e) => setCustomVal(e.target.value)}
                      placeholder="value (optional)"
                      onKeyDown={(e) => e.key === "Enter" && customPath && sendOsc(customPath, customVal || undefined)}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "7px",
                        padding: "9px 12px",
                        color: "#ddd",
                        fontSize: "12px",
                        fontFamily: "'Space Mono', monospace",
                        outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,43,0.4)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                    <GlowButton
                      onClick={() => {
                        if (customPath) {
                          sendOsc(customPath, customVal || undefined);
                          setCustomPath("");
                          setCustomVal("");
                        }
                      }}
                      active
                      style={{ flexShrink: 0 }}
                    >
                      SEND
                    </GlowButton>
                  </div>
                </div>

                {/* Log */}
                <div
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "14px",
                    padding: "16px",
                    minHeight: "200px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CommandLog logs={oscLogs} onClear={() => setOscLogs([])} />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          marginTop: "20px",
          borderTop: "1px solid rgba(0,255,200,0.05)",
        }}
      >
        <div
          className="holo-text"
          style={{ fontFamily: "'Orbitron', 'Space Mono', monospace", fontSize: "9px", letterSpacing: "0.25em" }}
        >
          EOS AI CONSOLE INTELLIGENCE — BUILT WITH ⚡ FOR THE LIGHTING COMMUNITY
        </div>
      </footer>
    </div>
  );
}
