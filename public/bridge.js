#!/usr/bin/env node
/**
 * EOS AI — Local OSC Bridge Server
 * 
 * This script receives WebSocket messages from the EOS AI web app
 * and relays them as UDP OSC packets to your lighting console.
 * 
 * Usage:
 *   1. Install dependencies:  npm install ws osc
 *   2. Run the bridge:        node bridge.js
 *   3. (Optional) Set port:   PORT=9000 node bridge.js
 * 
 * The web app sends JSON: { path, value, host, port }
 * This bridge converts it to a UDP OSC message and sends it.
 * 
 * For /eos/newcmd/ commands, the command text after the prefix
 * is sent as a string argument to /eos/newcmd (EOS protocol).
 */

const { Server: WebSocketServer } = require("ws");
const osc = require("osc");

const WS_PORT = parseInt(process.env.PORT || "8080", 10);

const wss = new WebSocketServer({ port: WS_PORT });

console.log(`\n⚡ EOS AI OSC Bridge`);
console.log(`  WebSocket listening on ws://localhost:${WS_PORT}`);
console.log(`  Waiting for connections...\n`);

// One shared UDP port for sending
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 0, // ephemeral
});

udpPort.open();

udpPort.on("ready", () => {
  console.log(`  UDP sender ready on port ${udpPort.options.localPort}`);
});

udpPort.on("error", (err) => {
  console.error("  UDP error:", err.message);
});

// Helper: parse an EOS command path into proper OSC address + args
function parseEosCommand(path, value) {
  // If command has spaces, convert to /eos/newcmd with string arg.
  // If already tokenized (/eos/newcmd/Chan/1/Patch/1/1/Enter), pass through as address.
  const newcmdPrefix = "/eos/newcmd/";
  if (path.startsWith(newcmdPrefix) && path.length > newcmdPrefix.length) {
    const suffix = path.slice(newcmdPrefix.length);
    if (suffix.includes(" ")) {
      return {
        address: "/eos/newcmd",
        args: [{ type: "s", value: suffix }],
      };
    }
    return { address: path, args: [] };
  }

  // /eos/cue/{n}/fire, /eos/sub/{n}, /eos/fx/{n}/rate etc.
  const args = [];
  if (value !== undefined && value !== null && value !== "") {
    const num = Number(value);
    if (!isNaN(num)) {
      args.push({ type: "f", value: num });
    } else {
      args.push({ type: "s", value: String(value) });
    }
  }

  return { address: path, args };
}

wss.on("connection", (ws, req) => {
  const origin = req.headers.origin || "unknown";
  console.log(`✓ Client connected from ${origin}`);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // Handle typed control messages from the app
      if (msg.type === "request_patch") {
        console.log("  ← Request patch dump from client");
        // Send OSC query to get patch data from console
        const oscMsg = { address: "/eos/get/patch/count", args: [] };
        udpPort.send(oscMsg, msg.host || "127.0.0.1", parseInt(msg.port || "3032", 10));
        ws.send(JSON.stringify({ ok: true, info: "Patch dump requested" }));
        return;
      }

      if (msg.type === "request_levels") {
        console.log("  ← Request levels from client");
        const oscMsg = { address: "/eos/get/chans/1/100", args: [] };
        udpPort.send(oscMsg, msg.host || "127.0.0.1", parseInt(msg.port || "3032", 10));
        ws.send(JSON.stringify({ ok: true, info: "Levels requested" }));
        return;
      }

      if (msg.type === "ping") {
        console.log("  ← Ping from client");
        const oscMsg = { address: "/eos/get/version", args: [] };
        udpPort.send(oscMsg, msg.host || "127.0.0.1", parseInt(msg.port || "3032", 10));
        // Respond with pong immediately (bridge is alive)
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      // Standard OSC relay
      const { path, value, host, port } = msg;

      if (!path || !host || !port) {
        console.warn("  ⚠ Invalid message (missing path/host/port):", msg);
        ws.send(JSON.stringify({ error: "Missing path, host, or port" }));
        return;
      }

      const oscMsg = parseEosCommand(path, value);

      udpPort.send(oscMsg, host, parseInt(port, 10));
      console.log(`  → OSC  ${oscMsg.address}  ${oscMsg.args.length ? JSON.stringify(oscMsg.args.map(a => a.value)) : "(no args)"}  → ${host}:${port}`);

      ws.send(JSON.stringify({ ok: true, path: oscMsg.address, host, port }));
    } catch (err) {
      console.error("  ✗ Parse error:", err.message);
      ws.send(JSON.stringify({ error: "Invalid JSON" }));
    }
  });

  ws.on("close", () => {
    console.log("✗ Client disconnected");
  });
});

process.on("SIGINT", () => {
  console.log("\n  Shutting down bridge...");
  wss.close();
  udpPort.close();
  process.exit(0);
});
