#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           EOS AI — SUPERPOWERED OSC BRIDGE  v3.0               ║
 * ║                                                                  ║
 * ║  Full bidirectional control of ETC Eos-family consoles          ║
 * ║                                                                  ║
 * ║  ✓ TX: Web app → Console (commands)                             ║
 * ║  ✓ RX: Console → Web app (live feedback)                        ║
 * ║  ✓ Auto-discovery of console on LAN                             ║
 * ║  ✓ Heartbeat / auto-reconnect detection                         ║
 * ║  ✓ Full patch dump with batched progress                        ║
 * ║  ✓ Full cue list sync (all lists)                               ║
 * ║  ✓ Live channel intensity + colour feedback                     ║
 * ║  ✓ Submaster level feedback                                     ║
 * ║  ✓ Softkey label sync                                           ║
 * ║  ✓ Groups, palettes, effects, macros dump                       ║
 * ║  ✓ Command line mirror                                          ║
 * ║  ✓ Active / pending cue tracking                               ║
 * ║  ✓ Multi-client WebSocket broadcast                             ║
 * ║  ✓ Rate limiting — prevent console flood                        ║
 * ║  ✓ Priority message queue                                       ║
 * ║  ✓ Batch command support                                        ║
 * ║  ✓ Auto-patch fixture sequences                                 ║
 * ║  ✓ Macro sequence firing                                        ║
 * ║  ✓ HTTP health check + state dump endpoint                      ║
 * ║  ✓ Full error recovery                                          ║
 * ║                                                                  ║
 * ║  Usage:  npm install ws osc                                      ║
 * ║          node bridge.js                                          ║
 * ║                                                                  ║
 * ║  ENV:  PORT=8080  EOS_HOST=auto  EOS_PORT=3032                  ║
 * ║        EOS_RX_PORT=3033  EOS_USER=1  HTTP_PORT=8081             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

"use strict";

const { Server: WebSocketServer } = require("ws");
const osc = require("osc");
const http = require("http");
const os = require("os");
const dgram = require("dgram");

// ── CONFIG ────────────────────────────────────────────────────────────────────
const WS_PORT = parseInt(process.env.PORT || "8080", 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || "8081", 10);
const EOS_HOST = process.env.EOS_HOST || "127.0.0.1";
const EOS_PORT = parseInt(process.env.EOS_PORT || "3032", 10);
const EOS_RX_PORT = parseInt(process.env.EOS_RX_PORT || "3033", 10);
const EOS_USER = process.env.EOS_USER || "1";
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || "50", 10);

// ── STATE ─────────────────────────────────────────────────────────────────────
let consoleHost = EOS_HOST === "auto" ? null : EOS_HOST;
let consolePort = EOS_PORT;
let consoleOnline = false;
let lastPong = 0;
let showName = "Unknown";
let eosVersion = "Unknown";

const msgQueue = [];
let sentThisSec = 0;
let queueBusy = false;

const state = {
  activeCue: null,
  pendingCue: null,
  commandLine: "",
  channels: {},
  cues: {},
  patch: {},
  groups: {},
  palettes: { color: {}, intensity: {}, focus: {}, beam: {} },
  effects: {},
  macros: {},
  subs: {},
  softkeys: {},
};

const clients = new Set();

// ── LOGGING ───────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  orange: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
};
const ts = () => C.gray + new Date().toLocaleTimeString("en-GB", { hour12: false }) + C.reset;
const logTX = (p, a, h) =>
  console.log(
    `${ts()} ${C.orange}→${C.reset} ${C.orange}${p}${C.reset}  ${C.gray}${String(a).slice(0, 60)}${C.reset}  ${C.gray}→ ${h}${C.reset}`,
  );
const logRX = (p, a) =>
  console.log(`${ts()} ${C.cyan}←${C.reset} ${C.cyan}${p}${C.reset}  ${C.gray}${String(a).slice(0, 60)}${C.reset}`);
const logOK = (m) => console.log(`${ts()} ${C.green}✓${C.reset} ${m}`);
const logWn = (m) => console.log(`${ts()} ${C.orange}⚠${C.reset} ${m}`);
const logEr = (m) => console.log(`${ts()} ${C.red}✗${C.reset} ${m}`);
const logIn = (m) => console.log(`${ts()} ${C.blue}·${C.reset} ${m}`);

console.log(`\n${C.orange}${C.bold}  ╔═══════════════════════════════════════════╗
  ║    EOS AI — SUPERPOWERED OSC BRIDGE v3.0  ║
  ╚═══════════════════════════════════════════╝${C.reset}\n`);
console.log(`  ${C.white}WebSocket${C.reset}   ${C.green}ws://localhost:${WS_PORT}${C.reset}`);
console.log(`  ${C.white}HTTP${C.reset}        ${C.green}http://localhost:${HTTP_PORT}/health${C.reset}`);
console.log(`  ${C.white}Console TX${C.reset}  ${consoleHost || C.orange + "auto-discover" + C.reset}:${EOS_PORT}`);
console.log(`  ${C.white}Bridge RX${C.reset}   ${C.cyan}:${EOS_RX_PORT}${C.reset}  (console sends feedback here)`);
console.log(`  ${C.white}Eos User${C.reset}    ${EOS_USER}\n`);

// ── PATH HELPERS ──────────────────────────────────────────────────────────────
function withUser(path) {
  if (!path) return path;
  if (path.startsWith("/eos/user/")) return path; // already prefixed
  if (path.startsWith("/eos/get/")) return path; // GET paths are always global
  if (path.startsWith("/eos/ping")) return path; // ping is global
  // key presses need user-scoping: /eos/user/1/key/go
  if (path.startsWith("/eos")) return `/eos/user/${EOS_USER}${path.slice(4)}`;
  return path;
}
function normalizeArgs(args) {
  if (!Array.isArray(args)) return [];
  return args.map((a) => (a && typeof a === "object" && "value" in a ? a.value : a));
}

// ── PATCH ACCUMULATOR (batch instead of per-entry broadcast) ─────────────────
const patchAccum = { entries: [], timer: null, FLUSH_MS: 500 };
function flushPatch() {
  if (patchAccum.entries.length === 0) return;
  const payload = {
    type: "console_feedback",
    subtype: "patch_complete",
    patch: patchAccum.entries.slice(),
    count: patchAccum.entries.length,
  };
  broadcast(payload);
  logIn(`Patch batch: ${patchAccum.entries.length} entries`);
  patchAccum.entries = [];
  patchAccum.timer = null;
}
function accumulatePatch(entry) {
  patchAccum.entries.push(entry);
  if (patchAccum.timer) clearTimeout(patchAccum.timer);
  patchAccum.timer = setTimeout(flushPatch, patchAccum.FLUSH_MS);
}

// ── UDP PORT ──────────────────────────────────────────────────────────────────
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: EOS_RX_PORT,
  metadata: true,
});
udpPort.open();
udpPort.on("ready", () => {
  logOK(`UDP bound :${EOS_RX_PORT} — receiving console feedback`);
  startHeartbeat();
  if (EOS_HOST === "auto") discoverConsole();
});
udpPort.on("error", (err) => {
  logEr(`UDP error: ${err.message}`);
  if (err.message.includes("EADDRINUSE")) {
    logEr(`Port ${EOS_RX_PORT} in use — change EOS_RX_PORT`);
    process.exit(1);
  }
});

// ── RATE-LIMITED QUEUE ────────────────────────────────────────────────────────
function enqueue(oscMsg, host, port, priority = false) {
  // Always ensure host is a clean IP string before queueing
  const safeHost = typeof host === "string" && host.trim().length > 6 ? host.trim() : "127.0.0.1";
  const safePort = typeof port === "number" && port > 0 ? port : EOS_PORT;
  if (priority) msgQueue.unshift({ oscMsg, host: safeHost, port: safePort });
  else msgQueue.push({ oscMsg, host: safeHost, port: safePort });
  if (!queueBusy) drain();
}
function drain() {
  if (!msgQueue.length) {
    queueBusy = false;
    return;
  }
  queueBusy = true;
  if (sentThisSec >= RATE_LIMIT) {
    setTimeout(drain, 25);
    return;
  }
  const { oscMsg, host, port } = msgQueue.shift();
  try {
    udpPort.send(oscMsg, host, port);
    logTX(oscMsg.address, JSON.stringify(normalizeArgs(oscMsg.args)), `${host}:${port}`);
    sentThisSec++;
  } catch (e) {
    logEr(`Send failed: ${e.message}`);
  }
  setImmediate(drain);
}
setInterval(() => {
  sentThisSec = 0;
}, 1000);

function sendOSC(address, args = [], host, port, priority = false) {
  let h = host || consoleHost;
  const p = port || consolePort;
  if (!h) {
    logWn(`No console host yet — dropped: ${address}`);
    return;
  }
  // Sanitize host — ensure it's a valid IP string, not truncated
  if (typeof h !== "string" || !h.match(/^[\d.]+$/)) {
    logWn(`Invalid host "${h}" — using 127.0.0.1`);
    h = "127.0.0.1";
  }
  enqueue({ address, args }, h, p, priority);
}

// ── AUTO-DISCOVERY ────────────────────────────────────────────────────────────
function discoverConsole() {
  logIn("Auto-discovering console on LAN...");
  broadcast({ type: "bridge_status", status: "discovering" });
  const ifaces = os.networkInterfaces();
  Object.values(ifaces).forEach((iface) => {
    iface.forEach((addr) => {
      if (addr.family !== "IPv4" || addr.internal) return;
      const parts = addr.address.split(".");
      const mask = addr.netmask.split(".");
      const bcast = parts.map((p, i) => parseInt(p) | (~parseInt(mask[i]) & 255)).join(".");
      logIn(`Broadcasting ping → ${bcast}:${EOS_PORT}`);
      const sock = dgram.createSocket("udp4");
      sock.bind(() => {
        sock.setBroadcast(true);
        const buf = Buffer.from("/eos/ping\x00\x00\x00,\x00\x00\x00", "binary");
        sock.send(buf, 0, buf.length, EOS_PORT, bcast, () => {
          setTimeout(() => sock.close(), 500);
        });
      });
    });
  });
  setTimeout(() => {
    if (!consoleHost) {
      logWn("Discovery timed out. Set EOS_HOST=<ip> manually.");
      broadcast({ type: "bridge_status", status: "discovery_failed" });
    }
  }, 8000);
}

// ── HEARTBEAT ─────────────────────────────────────────────────────────────────
function startHeartbeat() {
  setInterval(() => {
    if (!consoleHost) return;
    sendOSC("/eos/ping", [], null, null, true);
    if (lastPong > 0 && Date.now() - lastPong > 6000 && consoleOnline) {
      consoleOnline = false;
      logWn("Console went OFFLINE");
      broadcast({ type: "bridge_status", status: "console_offline" });
    }
  }, 3000);
}

// ── PARSE INCOMING OSC ────────────────────────────────────────────────────────
function parseIncoming(oscMsg, rinfo) {
  const addr = oscMsg?.address || "";
  const args = normalizeArgs(oscMsg?.args);

  if (EOS_HOST === "auto" && !consoleHost && rinfo?.address && rinfo.address !== "0.0.0.0") {
    consoleHost = rinfo.address;
    logOK(`Console auto-discovered at ${consoleHost}`);
    broadcast({ type: "bridge_status", status: "discovered", host: consoleHost });
  }

  // PING
  if (addr.includes("/out/ping")) {
    lastPong = Date.now();
    if (!consoleOnline) {
      consoleOnline = true;
      logOK(`Console ONLINE at ${consoleHost}`);
      broadcast({ type: "bridge_status", status: "console_online", host: consoleHost });
      setTimeout(syncShowInfo, 500);
    }
    return { type: "pong", source: "console" };
  }

  // VERSION
  if (addr.includes("/out/get/version")) {
    eosVersion = String(args[0] ?? "Unknown");
    return { type: "console_feedback", subtype: "version", version: eosVersion };
  }

  // SHOW NAME
  if (addr.includes("/out/show/name") || addr.includes("/out/get/show/name")) {
    showName = String(args[0] ?? "Unknown");
    return { type: "console_feedback", subtype: "show_name", name: showName };
  }

  // COMMAND LINE
  if (addr.includes("/out/cmd") || addr.includes("/out/command") || addr.includes("/out/active/cmd")) {
    const text = args.map(String).join(" ");
    state.commandLine = text;
    return { type: "command_line", text, address: addr };
  }

  // ACTIVE / PENDING CUE
  if (/\/out\/(active|pending)\/cue/.test(addr)) {
    const isPending = addr.includes("/pending/");
    const cueNum = args.find((a) => typeof a === "number" || /^\d+(\.\d+)?$/.test(String(a)));
    const label = args.find((a) => typeof a === "string") || "";
    const numA = args.filter((a) => typeof a === "number");
    const cueStr = cueNum !== undefined ? String(cueNum) : null;
    if (isPending) state.pendingCue = cueStr;
    else state.activeCue = cueStr;
    return {
      type: "console_feedback",
      subtype: isPending ? "pending_cue" : "active_cue",
      cue: cueStr,
      label: String(label),
      up_time: numA[1] ?? null,
      down_time: numA[2] ?? null,
      address: addr,
      args,
    };
  }

  // CUE COUNT
  if (addr.match(/\/out\/get\/cue\/\d+\/count/)) {
    const count = args.find((a) => typeof a === "number" || /^\d+$/.test(String(a)));
    const lm = addr.match(/\/cue\/(\d+)\/count/);
    return {
      type: "console_feedback",
      subtype: "cue_count",
      cue_list: lm ? lm[1] : "1",
      count: count ? Number(count) : 0,
      address: addr,
      args,
    };
  }

  // CUE DATA
  const cueDataMatch = addr.match(/\/out\/get\/cue\/(\d+)\/(\d+(?:\.\d+)?)\/?(.*)$/);
  if (cueDataMatch) {
    const listId = cueDataMatch[1],
      cueNum = cueDataMatch[2],
      prop = cueDataMatch[3] || "";
    if (!prop) {
      const label = args.find((a) => typeof a === "string") || "";
      const numA = args.filter((a) => typeof a === "number");
      const entry = {
        label: String(label),
        up_time: numA[0] ?? null,
        down_time: numA[1] ?? null,
        follow_time: numA[2] ?? null,
      };
      if (!state.cues[listId]) state.cues[listId] = {};
      state.cues[listId][cueNum] = entry;
      return {
        type: "console_feedback",
        subtype: "cue_data",
        cue_list: listId,
        cue_number: cueNum,
        ...entry,
        address: addr,
        args,
      };
    }
    return {
      type: "console_feedback",
      subtype: "cue_property",
      cue_list: listId,
      cue_number: cueNum,
      property: prop,
      value: args[0] ?? null,
      address: addr,
      args,
    };
  }

  // CHANNEL INTENSITY (bulk pairs)
  if (addr.includes("/out/get/chans") || addr.match(/\/out\/chan\/\d+\/param\/intensity/)) {
    if (args.length >= 2 && typeof args[0] === "number" && typeof args[1] === "number") {
      const channels = [];
      for (let i = 0; i + 1 < args.length; i += 2) {
        const ch = Number(args[i]),
          val = Number(args[i + 1]);
        if (!isNaN(ch) && !isNaN(val)) {
          channels.push({ channel: ch, intensity: val });
          if (!state.channels[ch]) state.channels[ch] = {};
          state.channels[ch].intensity = val;
        }
      }
      if (channels.length > 0)
        return { type: "console_feedback", subtype: "channel_intensity", channels, address: addr };
    }
    const chM = addr.match(/\/chan\/(\d+)\/param\/intensity/);
    if (chM) {
      const ch = parseInt(chM[1]);
      if (!state.channels[ch]) state.channels[ch] = {};
      state.channels[ch].intensity = args[0];
      return {
        type: "console_feedback",
        subtype: "channel_intensity",
        channels: [{ channel: ch, intensity: args[0] }],
        address: addr,
      };
    }
  }

  // CHANNEL COLOUR
  const colM = addr.match(/\/out\/chan\/(\d+)\/color/);
  if (colM) {
    const ch = parseInt(colM[1]);
    if (!state.channels[ch]) state.channels[ch] = {};
    state.channels[ch].r = args[0];
    state.channels[ch].g = args[1];
    state.channels[ch].b = args[2];
    return {
      type: "console_feedback",
      subtype: "channel_color",
      channel: ch,
      r: args[0],
      g: args[1],
      b: args[2],
      address: addr,
    };
  }

  // CHANNEL LABEL
  const lblM = addr.match(/\/out\/chan\/(\d+)\/label/);
  if (lblM) {
    const ch = parseInt(lblM[1]);
    if (!state.channels[ch]) state.channels[ch] = {};
    state.channels[ch].label = args[0];
    return { type: "console_feedback", subtype: "channel_label", channel: ch, label: args[0], address: addr };
  }

  // SUBMASTER
  const subM = addr.match(/\/out\/sub\/(\d+)\/(level|label)/);
  if (subM) {
    const sub = parseInt(subM[1]),
      prop = subM[2];
    if (!state.subs[sub]) state.subs[sub] = {};
    state.subs[sub][prop] = args[0];
    return { type: "console_feedback", subtype: "submaster", sub, [prop]: args[0], address: addr };
  }

  // PATCH COUNT
  if (addr.match(/\/out\/get\/patch\/count/)) {
    const count = args.find((a) => typeof a === "number" || /^\d+$/.test(String(a)));
    return { type: "console_feedback", subtype: "patch_count", count: count ? Number(count) : 0, address: addr, args };
  }

  // PATCH ENTRY
  if (addr.match(/\/out\/get\/patch\/\d+\/\d+/)) {
    const numA = args.filter((a) => typeof a === "number"),
      strA = args.filter((a) => typeof a === "string");
    const channel = numA[0] ?? null,
      dmxAbs = numA[1] ?? null;
    let universe = null,
      dmxAddress = null;
    if (dmxAbs !== null && dmxAbs > 0) {
      universe = Math.ceil(dmxAbs / 512);
      dmxAddress = ((dmxAbs - 1) % 512) + 1;
    }
    const entry = {
      channel: channel !== null ? Number(channel) : null,
      universe,
      dmxAddress,
      fixture_type: strA[0] ?? null,
      notes: strA[1] ?? null,
      raw_address: dmxAbs,
    };
    if (entry.channel !== null) state.patch[entry.channel] = entry;
    // Accumulate patch entries — send as single batch, not per-entry
    accumulatePatch(entry);
    return null; // Don't broadcast individually
  }

  // GROUP COUNT
  if (addr.match(/\/out\/get\/group\/count/)) {
    return { type: "console_feedback", subtype: "group_count", count: Number(args[0] ?? 0), address: addr };
  }
  const grpM = addr.match(/\/out\/get\/group\/(\d+)/);
  if (grpM) {
    const gn = grpM[1],
      label = args.find((a) => typeof a === "string") || "",
      channels = args.filter((a) => typeof a === "number");
    state.groups[gn] = { label: String(label), channels };
    return {
      type: "console_feedback",
      subtype: "group_data",
      group: gn,
      label: String(label),
      channels,
      address: addr,
    };
  }

  // PALETTE
  const palM = addr.match(/\/out\/get\/(color|intensity|focus|beam)_palette\/(\d+)/);
  if (palM) {
    const ptype = palM[1],
      pnum = palM[2],
      label = args.find((a) => typeof a === "string") || "";
    if (!state.palettes[ptype]) state.palettes[ptype] = {};
    state.palettes[ptype][pnum] = { label: String(label) };
    return {
      type: "console_feedback",
      subtype: "palette_data",
      palette_type: ptype,
      number: pnum,
      label: String(label),
      address: addr,
    };
  }

  // EFFECT
  const fxM = addr.match(/\/out\/get\/fx\/(\d+)/);
  if (fxM) {
    const label = args.find((a) => typeof a === "string") || "";
    state.effects[fxM[1]] = { label: String(label) };
    return { type: "console_feedback", subtype: "effect_data", effect: fxM[1], label: String(label), address: addr };
  }

  // MACRO
  const macM = addr.match(/\/out\/get\/macro\/(\d+)/);
  if (macM) {
    const label = args.find((a) => typeof a === "string") || "";
    state.macros[macM[1]] = { label: String(label) };
    return { type: "console_feedback", subtype: "macro_data", macro: macM[1], label: String(label), address: addr };
  }

  // SOFTKEY
  const skM = addr.match(/\/out\/softkey\/(\d+)/);
  if (skM) {
    const key = parseInt(skM[1]),
      label = String(args[0] ?? "");
    state.softkeys[key] = label;
    return { type: "console_feedback", subtype: "softkey", key, label, address: addr };
  }

  // ERROR
  if (addr.includes("/out/error")) {
    return { type: "console_feedback", subtype: "console_error", message: String(args[0] ?? ""), address: addr };
  }

  return { type: "console_feedback", subtype: "raw", address: addr, args };
}

udpPort.on("message", (oscMsg, rinfo) => {
  try {
    const parsed = parseIncoming(oscMsg, rinfo);
    if (parsed) {
      broadcast(parsed);
    }
    // Only log non-patch traffic to reduce noise
    if (!oscMsg.address?.includes("/patch/")) {
      logRX(oscMsg.address, JSON.stringify(normalizeArgs(oscMsg.args)));
    }
  } catch (err) {
    logEr(`RX parse: ${err.message}`);
  }
});

// ── BUILD OSC FROM WS MESSAGE ─────────────────────────────────────────────────
function buildOsc(msg) {
  const { path, args: rawArgs, value } = msg;
  const pfx = "/eos/newcmd/";
  if (path.startsWith(pfx) && path.length > pfx.length)
    return { address: withUser("/eos/newcmd"), args: [{ type: "s", value: path.slice(pfx.length) }] };
  if (Array.isArray(rawArgs) && rawArgs.length > 0) return { address: withUser(path), args: rawArgs };
  if (path === "/eos/newcmd" || path === "/eos/cmd") {
    if (value !== undefined && value !== null && value !== "")
      return { address: withUser(path), args: [{ type: "s", value: String(value) }] };
    return { address: withUser(path), args: [] };
  }
  // withUser already handles global path exclusions (GET, ping, key)
  const address = withUser(path);
  const typedArgs = [];
  if (value !== undefined && value !== null && value !== "") {
    const num = Number(value);
    typedArgs.push(!isNaN(num) ? { type: "f", value: num } : { type: "s", value: String(value) });
  }
  return { address, args: typedArgs };
}

// ── SYNC HELPERS ──────────────────────────────────────────────────────────────
function syncShowInfo() {
  sendOSC("/eos/get/show/name", [], null, null, true);
  sendOSC("/eos/get/version", [], null, null, true);
  sendOSC(withUser("/eos/get/cue/1/count"), []);
  sendOSC("/eos/get/patch/count", []);
  logIn("Show info sync requested");
}

function syncPatch(ws, host, port) {
  logIn("Requesting patch dump...");
  const onCount = (oscMsg) => {
    if (!oscMsg?.address?.match(/\/out\/get\/patch\/count/)) return;
    const args = normalizeArgs(oscMsg.args);
    const total = Number(args.find((a) => typeof a === "number" || /^\d+$/.test(String(a))) || 0);
    udpPort.removeListener("message", onCount);
    broadcast({ type: "console_feedback", subtype: "patch_count", count: total });
    logIn(`Fetching ${total} patch entries...`);
    const bsz = 10;
    let idx = 0;
    function nextBatch() {
      const end = Math.min(idx + bsz, total);
      for (let i = idx; i < end; i++) enqueue({ address: `/eos/get/patch/1/${i}`, args: [] }, host, port);
      idx = end;
      if (idx < total) setTimeout(nextBatch, 200);
    }
    nextBatch();
  };
  udpPort.on("message", onCount);
  setTimeout(() => udpPort.removeListener("message", onCount), 10000);
  sendOSC("/eos/get/patch/count", [], host, port, true);
  ws.send(JSON.stringify({ ok: true, type: "request_patch" }));
}

function syncCues(ws, host, port, cueList = "1") {
  logIn(`Requesting cue list ${cueList}...`);
  const onCount = (oscMsg) => {
    const addr = oscMsg?.address || "";
    if (!addr.match(new RegExp(`/out/get/cue/${cueList}/count`))) return;
    const args = normalizeArgs(oscMsg.args);
    const total = Number(args.find((a) => typeof a === "number" || /^\d+$/.test(String(a))) || 0);
    udpPort.removeListener("message", onCount);
    logIn(`Fetching ${total} cues from list ${cueList}...`);
    const bsz = 10;
    let idx = 0;
    function nextBatch() {
      const end = Math.min(idx + bsz, total);
      for (let i = idx; i < end; i++)
        enqueue({ address: withUser(`/eos/get/cue/${cueList}/${i}`), args: [] }, host, port);
      idx = end;
      if (idx < total) setTimeout(nextBatch, 150);
    }
    nextBatch();
  };
  udpPort.on("message", onCount);
  setTimeout(() => udpPort.removeListener("message", onCount), 10000);
  sendOSC(withUser(`/eos/get/cue/${cueList}/count`), [], host, port, true);
  ws.send(JSON.stringify({ ok: true, type: "request_cues", cueList }));
}

function syncGroups(host, port) {
  const onCount = (oscMsg) => {
    if (!oscMsg.address.includes("/out/get/group/count")) return;
    const total = Number(normalizeArgs(oscMsg.args).find((a) => typeof a === "number") || 0);
    udpPort.removeListener("message", onCount);
    for (let i = 0; i < total; i++) enqueue({ address: withUser(`/eos/get/group/${i}`), args: [] }, host, port);
  };
  udpPort.on("message", onCount);
  setTimeout(() => udpPort.removeListener("message", onCount), 5000);
  sendOSC(withUser("/eos/get/group/count"), [], host, port);
}

function syncPalettes(host, port) {
  ["color", "intensity", "focus", "beam"].forEach((ptype) => {
    const onCount = (oscMsg) => {
      if (!oscMsg.address.includes(`/out/get/${ptype}_palette/count`)) return;
      const total = Number(normalizeArgs(oscMsg.args).find((a) => typeof a === "number") || 0);
      udpPort.removeListener("message", onCount);
      for (let i = 0; i < total; i++)
        enqueue({ address: withUser(`/eos/get/${ptype}_palette/${i}`), args: [] }, host, port);
    };
    udpPort.on("message", onCount);
    setTimeout(() => udpPort.removeListener("message", onCount), 5000);
    sendOSC(withUser(`/eos/get/${ptype}_palette/count`), [], host, port);
  });
}

function syncEffects(host, port) {
  const onCount = (oscMsg) => {
    if (!oscMsg.address.includes("/out/get/fx/count")) return;
    const total = Number(normalizeArgs(oscMsg.args).find((a) => typeof a === "number") || 0);
    udpPort.removeListener("message", onCount);
    for (let i = 0; i < total; i++) enqueue({ address: withUser(`/eos/get/fx/${i}`), args: [] }, host, port);
  };
  udpPort.on("message", onCount);
  setTimeout(() => udpPort.removeListener("message", onCount), 5000);
  sendOSC(withUser("/eos/get/fx/count"), [], host, port);
}

function syncMacros(host, port) {
  const onCount = (oscMsg) => {
    if (!oscMsg.address.includes("/out/get/macro/count")) return;
    const total = Number(normalizeArgs(oscMsg.args).find((a) => typeof a === "number") || 0);
    udpPort.removeListener("message", onCount);
    for (let i = 0; i < total; i++) enqueue({ address: withUser(`/eos/get/macro/${i}`), args: [] }, host, port);
  };
  udpPort.on("message", onCount);
  setTimeout(() => udpPort.removeListener("message", onCount), 5000);
  sendOSC(withUser("/eos/get/macro/count"), [], host, port);
}

function syncAll(ws, host, port) {
  logIn("FULL SYNC — pulling all console data...");
  syncShowInfo();
  syncCues(ws, host, port, "1");
  setTimeout(() => syncPatch(ws, host, port), 800);
  setTimeout(() => syncGroups(host, port), 1600);
  setTimeout(() => syncPalettes(host, port), 2400);
  setTimeout(() => syncEffects(host, port), 3200);
  setTimeout(() => syncMacros(host, port), 4000);
  setTimeout(() => sendOSC(withUser("/eos/get/chans/1/512"), [], host, port), 4800);
}

// ── WEBSOCKET SERVER ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws, req) => {
  clients.add(ws);
  const origin = req.headers?.origin || req.socket?.remoteAddress || "unknown";
  logOK(`Web app connected from ${origin}  (${clients.size} total)`);

  ws.send(
    JSON.stringify({
      type: "bridge_status",
      status: consoleOnline ? "console_online" : "console_offline",
      host: consoleHost,
      port: consolePort,
      rx_port: EOS_RX_PORT,
      eos_user: EOS_USER,
      show_name: showName,
      eos_version: eosVersion,
      state_summary: {
        channels_cached: Object.keys(state.channels).length,
        cue_lists: Object.keys(state.cues).length,
        patch_entries: Object.keys(state.patch).length,
      },
    }),
  );

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }
    const host = msg.host || consoleHost || "127.0.0.1";
    const port = parseInt(msg.port || String(EOS_PORT), 10);

    if (msg.type === "set_target") {
      consoleHost = msg.host;
      consolePort = parseInt(msg.port || String(EOS_PORT), 10);
      logIn(`Target → ${consoleHost}:${consolePort}`);
      broadcast({ type: "bridge_status", status: "target_updated", host: consoleHost, port: consolePort });
      ws.send(JSON.stringify({ ok: true, type: "set_target" }));
      return;
    }
    if (msg.type === "ping") {
      sendOSC("/eos/ping", [], host, port, true);
      ws.send(JSON.stringify({ type: "pong", source: "bridge", timestamp: Date.now(), console_online: consoleOnline }));
      return;
    }
    if (msg.type === "get_state") {
      ws.send(JSON.stringify({ type: "state_snapshot", state }));
      return;
    }
    if (msg.type === "full_sync") {
      syncAll(ws, host, port);
      ws.send(JSON.stringify({ ok: true, type: "full_sync" }));
      return;
    }
    if (msg.type === "request_levels") {
      sendOSC(withUser(`/eos/get/chans/${msg.from || 1}/${msg.to || 512}`), [], host, port);
      ws.send(JSON.stringify({ ok: true, type: "request_levels" }));
      return;
    }
    if (msg.type === "request_patch") {
      syncPatch(ws, host, port);
      return;
    }
    if (msg.type === "request_cues") {
      syncCues(ws, host, port, msg.cueList || "1");
      return;
    }
    if (msg.type === "request_groups") {
      syncGroups(host, port);
      ws.send(JSON.stringify({ ok: true, type: "request_groups" }));
      return;
    }
    if (msg.type === "request_palettes") {
      syncPalettes(host, port);
      ws.send(JSON.stringify({ ok: true, type: "request_palettes" }));
      return;
    }
    if (msg.type === "request_effects") {
      syncEffects(host, port);
      ws.send(JSON.stringify({ ok: true, type: "request_effects" }));
      return;
    }
    if (msg.type === "request_macros") {
      syncMacros(host, port);
      ws.send(JSON.stringify({ ok: true, type: "request_macros" }));
      return;
    }

    if (msg.type === "batch" && Array.isArray(msg.commands)) {
      let delay = 0;
      msg.commands.forEach((cmd) => {
        setTimeout(() => enqueue(buildOsc(cmd), host, port), delay);
        delay += msg.interval || 50;
      });
      ws.send(JSON.stringify({ ok: true, type: "batch", count: msg.commands.length }));
      return;
    }

    if (msg.type === "macro_sequence" && Array.isArray(msg.macros)) {
      let delay = 0;
      msg.macros.forEach((n) => {
        setTimeout(() => sendOSC(withUser(`/eos/macro/${n}/fire`), [], host, port), delay);
        delay += msg.interval || 500;
      });
      ws.send(JSON.stringify({ ok: true, type: "macro_sequence" }));
      return;
    }

    if (msg.type === "auto_patch") {
      if (!Array.isArray(msg.fixtures)) {
        ws.send(JSON.stringify({ error: "auto_patch requires fixtures array" }));
        return;
      }
      sendOSC("/eos/key/patch", [], host, port, true);
      let delay = 200;
      msg.fixtures.forEach((fix) => {
        const { channel, dmxAddress, fixtureType, label } = fix;
        setTimeout(() => {
          if (fixtureType)
            sendOSC(
              withUser("/eos/newcmd"),
              [{ type: "s", value: `Chan ${channel} Type ${fixtureType} Enter` }],
              host,
              port,
            );
          if (dmxAddress)
            sendOSC(
              withUser("/eos/newcmd"),
              [{ type: "s", value: `Chan ${channel} Address ${dmxAddress} Enter` }],
              host,
              port,
            );
          if (label)
            sendOSC(
              withUser("/eos/newcmd"),
              [{ type: "s", value: `Chan ${channel} Label ${label} Enter` }],
              host,
              port,
            );
        }, delay);
        delay += 300;
      });
      setTimeout(() => sendOSC("/eos/key/live", [], host, port), delay);
      ws.send(JSON.stringify({ ok: true, type: "auto_patch", count: msg.fixtures.length }));
      return;
    }

    if (!msg.path) {
      logWn(`Missing path: ${JSON.stringify(msg)}`);
      ws.send(JSON.stringify({ error: "Missing path" }));
      return;
    }

    try {
      const oscMsg = buildOsc(msg);
      enqueue(oscMsg, host, port, msg.priority === true);
      ws.send(JSON.stringify({ ok: true, path: oscMsg.address, host, port }));
    } catch (err) {
      logEr(`Build OSC: ${err.message}`);
      ws.send(JSON.stringify({ error: err.message }));
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    logWn(`Client disconnected (${clients.size} remaining)`);
  });
  ws.on("error", (err) => {
    logEr(`WS error: ${err.message}`);
    clients.delete(ws);
  });
});

wss.on("error", (err) => {
  logEr(`WS server: ${err.message}`);
  if (err.code === "EADDRINUSE") {
    logEr(`Port ${WS_PORT} in use — set PORT= to another`);
    process.exit(1);
  }
});

// ── HTTP HEALTH ───────────────────────────────────────────────────────────────
const httpServer = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          status: "ok",
          bridge: "EOS AI OSC Bridge v3.0",
          console_host: consoleHost,
          console_port: consolePort,
          console_online: consoleOnline,
          ws_clients: clients.size,
          show_name: showName,
          eos_version: eosVersion,
          eos_user: EOS_USER,
          uptime_s: Math.floor(process.uptime()),
          state: {
            active_cue: state.activeCue,
            pending_cue: state.pendingCue,
            command_line: state.commandLine,
            channels_cached: Object.keys(state.channels).length,
            patch_entries: Object.keys(state.patch).length,
            cue_lists: Object.keys(state.cues).length,
            groups: Object.keys(state.groups).length,
            macros: Object.keys(state.macros).length,
            effects: Object.keys(state.effects).length,
          },
        },
        null,
        2,
      ),
    );
    return;
  }
  if (req.url === "/state") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(state, null, 2));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});
httpServer.listen(HTTP_PORT, () => {
  logOK(`HTTP → http://localhost:${HTTP_PORT}/health  |  /state`);
});

// ── BROADCAST ─────────────────────────────────────────────────────────────────
function broadcast(payload) {
  const json = JSON.stringify(payload);
  clients.forEach((ws) => {
    try {
      if (ws.readyState === 1) ws.send(json);
    } catch (e) {
      clients.delete(ws);
    }
  });
}

// ── SHUTDOWN ──────────────────────────────────────────────────────────────────
function shutdown(sig) {
  console.log(`\n  ${sig} — shutting down...`);
  broadcast({ type: "bridge_status", status: "disconnected" });
  try {
    udpPort.close();
  } catch (e) {}
  try {
    httpServer.close();
  } catch (e) {}
  wss.close(() => {
    logOK("Bridge shut down.");
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

logOK("Bridge ready — waiting for console and web app...\n");
