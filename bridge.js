#!/usr/bin/env node
/**
 * EOS AI — Local OSC Bridge Server
 * Run: npm install ws osc && node bridge.js
 */

const { Server: WebSocketServer } = require("ws");
const osc = require("osc");

const WS_PORT = parseInt(process.env.PORT || "8080", 10);
const EOS_USER = process.env.EOS_USER || "1";

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`\n⚡ EOS AI OSC Bridge`);
console.log(`  WebSocket listening on ws://localhost:${WS_PORT}`);
console.log(`  EOS user: ${EOS_USER}`);
console.log(`  Waiting for connections...\n`);

const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 0,
  metadata: true,
});
udpPort.open();
udpPort.on("ready", () => console.log(`  UDP sender ready on port ${udpPort.options.localPort}`));
udpPort.on("error", (err) => console.error("  UDP error:", err.message));

const clients = new Set();

function withUserPath(path) {
  if (path.startsWith("/eos/user/")) return path;
  if (path.startsWith("/eos")) return `/eos/user/${EOS_USER}${path.slice(4)}`;
  return path;
}

function normalizeArgs(args) {
  if (!Array.isArray(args)) return [];
  return args.map((a) => (a && typeof a === "object" && "value" in a ? a.value : a));
}

function parseEosCommand(path, value) {
  const newcmdPrefix = "/eos/newcmd/";

  // Legacy: command string embedded in path (e.g. /eos/newcmd/Cue 1 Go Enter)
  // Convert to /eos/newcmd with string arg
  if (path.startsWith(newcmdPrefix) && path.length > newcmdPrefix.length) {
    const suffix = path.slice(newcmdPrefix.length);
    return {
      address: withUserPath("/eos/newcmd"),
      args: [{ type: "s", value: suffix }],
    };
  }

  // /eos/newcmd with no embedded suffix — value should be the command string
  if (path === "/eos/newcmd") {
    if (value !== undefined && value !== null && value !== "") {
      return {
        address: withUserPath("/eos/newcmd"),
        args: [{ type: "s", value: String(value) }],
      };
    }
    // No value — send as-is (will be a no-op on EOS)
    return { address: withUserPath("/eos/newcmd"), args: [] };
  }

  // /eos/cmd passthrough
  if (path === "/eos/cmd" || path === withUserPath("/eos/cmd")) {
    if (value !== undefined && value !== null && value !== "") {
      return {
        address: withUserPath("/eos/cmd"),
        args: [{ type: "s", value: String(value) }],
      };
    }
  }

  // Default passthrough (+ optional numeric/string arg)
  const args = [];
  if (value !== undefined && value !== null && value !== "") {
    const num = Number(value);
    args.push(!isNaN(num) ? { type: "f", value: num } : { type: "s", value: String(value) });
  }

  return { address: withUserPath(path), args };
}

function parseConsoleOscMessage(oscMsg) {
  const address = oscMsg?.address || "";
  const args = normalizeArgs(oscMsg?.args);

  // Console online check
  if (address.includes("/out/get/version") || address.includes("/out/ping")) {
    return { type: "pong", source: "console", version: args[0] ?? null };
  }

  // Command line text
  if (address.includes("/out/cmd") || address.includes("/out/command") || address.includes("/out/cmd_line")) {
    return {
      type: "command_line",
      text: args.map((a) => String(a)).join(" "),
      address,
    };
  }

  // Cue list data: /eos/out/get/cue/1/X/... or /eos/out/get/cue/1/count
  if (address.match(/\/out\/get\/cue\/\d+\/count/)) {
    const countArg = args.find((a) => typeof a === "number" || /^\d+$/.test(String(a)));
    return {
      type: "console_feedback",
      subtype: "cue_count",
      count: countArg ? Number(countArg) : 0,
      address,
      args,
    };
  }

  // Cue data: /eos/out/get/cue/1/<cue_number>/...
  // EOS returns: cue_number, label, up_time, down_time, follow, hang, etc.
  const cueDataMatch = address.match(/\/out\/get\/cue\/(\d+)\/(\d+(?:\.\d+)?)\/?(.*)$/);
  if (cueDataMatch) {
    const cueListId = cueDataMatch[1];
    const cueNumber = cueDataMatch[2];
    const property = cueDataMatch[3] || "";

    // If property is empty, this is the main cue info line
    // EOS sends: cue_number, cue_label (as first string arg), up_time, down_time
    if (!property) {
      const label = args.find((a) => typeof a === "string") || "";
      const numArgs = args.filter((a) => typeof a === "number");
      return {
        type: "console_feedback",
        subtype: "cue_data",
        cue_list: cueListId,
        cue_number: cueNumber,
        label: String(label),
        up_time: numArgs[0] ?? null,
        down_time: numArgs[1] ?? null,
        follow_time: numArgs[2] ?? null,
        address,
        args,
      };
    }

    // Specific property replies (label, duration, etc.)
    return {
      type: "console_feedback",
      subtype: "cue_property",
      cue_list: cueListId,
      cue_number: cueNumber,
      property,
      value: args[0] ?? null,
      address,
      args,
    };
  }

  // Active cue feedback: only trust explicit active/pending cue endpoints.
  // This prevents cue-list sync replies (e.g. /out/get/cue/.../99) from overriding active cue.
  if (/\/out\/(active|pending)\/cue(\/|$)/.test(address)) {
    const cueArg = args.find((a) => typeof a === "number" || /^\d+(\.\d+)?$/.test(String(a)));
    return {
      type: "console_feedback",
      subtype: "active_cue",
      active_cue: cueArg ? String(cueArg) : null,
      address,
      args,
    };
  }

  // Channel levels
  if (address.includes("chan") || address.includes("level") || address.includes("/out/get/chans")) {
    const channels = [];

    // expected pairs: chan, level, chan, level...
    for (let i = 0; i < args.length - 1; i += 2) {
      const channel = Number(args[i]);
      const intensity = Number(args[i + 1]);
      if (!isNaN(channel) && !isNaN(intensity)) {
        channels.push({ channel, intensity });
      }
    }

    if (channels.length > 0) {
      return {
        type: "console_feedback",
        subtype: "channel_intensity",
        channels,
        channel_count: channels.length,
        address,
      };
    }
  }

  // Patch rows (best-effort parse as channel, universe, address triples)
  if (address.includes("patch")) {
    const patch = [];
    for (let i = 0; i < args.length - 2; i += 3) {
      const channel = Number(args[i]);
      const universe = Number(args[i + 1]);
      const addr = Number(args[i + 2]);
      if (!isNaN(channel) && !isNaN(universe) && !isNaN(addr)) {
        patch.push({ channel, universe, address: addr });
      }
    }

    return {
      type: "console_feedback",
      subtype: "patch",
      patch,
      address,
      args,
    };
  }

  // Raw fallback (useful for debugging unknown EOS replies)
  return {
    type: "console_feedback",
    subtype: "raw",
    address,
    args,
  };
}

function broadcast(payload) {
  const json = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(json);
  });
}

udpPort.on("message", (oscMsg) => {
  try {
    const feedback = parseConsoleOscMessage(oscMsg);
    broadcast(feedback);
    console.log(`  ← OSC  ${oscMsg.address}  ${JSON.stringify(normalizeArgs(oscMsg.args))}`);
  } catch (err) {
    console.error("  ✗ Incoming OSC parse error:", err.message);
  }
});

wss.on("connection", (ws, req) => {
  clients.add(ws);
  console.log(`✓ Client connected from ${req.headers.origin || "unknown"}`);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      const host = msg.host || "127.0.0.1";
      const port = parseInt(msg.port || "3033", 10);

      // Poll-style request APIs from app
      if (msg.type === "ping") {
        udpPort.send({ address: "/eos/ping", args: [] }, host, port);
        ws.send(JSON.stringify({ type: "pong", source: "bridge", timestamp: Date.now() }));
        return;
      }

      if (msg.type === "request_levels") {
        // GET requests: do NOT use withUserPath — EOS GET endpoints are global
        udpPort.send({ address: "/eos/get/chans/1/512", args: [] }, host, port);
        ws.send(JSON.stringify({ ok: true, type: "request_levels" }));
        return;
      }

      if (msg.type === "request_patch") {
        udpPort.send({ address: "/eos/get/patch/count", args: [] }, host, port);
        udpPort.send({ address: "/eos/get/patch/1/512", args: [] }, host, port);
        ws.send(JSON.stringify({ ok: true, type: "request_patch" }));
        return;
      }

      if (msg.type === "request_cues") {
        const cueList = msg.cueList || "1";
        // Only request count — do NOT flood 100 individual cue GETs
        udpPort.send({ address: `/eos/get/cue/${cueList}/count`, args: [] }, host, port);
        ws.send(JSON.stringify({ ok: true, type: "request_cues" }));
        return;
      }

      const { path, args: rawArgs, value } = msg;
      if (!path) {
        ws.send(JSON.stringify({ error: "Missing OSC path" }));
        return;
      }

      // New format: app sends { path, args: [{type, value}] }
      // Legacy format: app sends { path, value }
      let oscMsg;
      if (Array.isArray(rawArgs) && rawArgs.length > 0) {
        // Direct typed args from app — send as-is with user path
        oscMsg = { address: withUserPath(path), args: rawArgs };
      } else {
        // No args or legacy: parse path (handles /eos/newcmd/Command String format)
        oscMsg = parseEosCommand(path, value);
      }
      udpPort.send(oscMsg, host, port);

      console.log(
        `  → OSC  ${oscMsg.address}  ${oscMsg.args.length ? JSON.stringify(oscMsg.args.map((a) => a.value)) : "(no args)"}  → ${host}:${port}`,
      );

      ws.send(JSON.stringify({ ok: true, path: oscMsg.address, host, port }));
    } catch (err) {
      console.error("  ✗ Parse error:", err.message);
      ws.send(JSON.stringify({ error: "Invalid JSON" }));
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("✗ Client disconnected");
  });
});

process.on("SIGINT", () => {
  console.log("\n  Shutting down bridge...");
  wss.close();
  udpPort.close();
  process.exit(0);
});
