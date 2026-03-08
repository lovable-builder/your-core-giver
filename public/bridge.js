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

wss.on("connection", (ws, req) => {
  const origin = req.headers.origin || "unknown";
  console.log(`✓ Client connected from ${origin}`);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { path, value, host, port } = msg;

      if (!path || !host || !port) {
        console.warn("  ⚠ Invalid message (missing path/host/port):", msg);
        ws.send(JSON.stringify({ error: "Missing path, host, or port" }));
        return;
      }

      // Build OSC args
      const args = [];
      if (value !== undefined && value !== null && value !== "") {
        const num = Number(value);
        if (!isNaN(num)) {
          args.push({ type: "f", value: num });
        } else {
          args.push({ type: "s", value: String(value) });
        }
      }

      const oscMsg = { address: path, args };

      udpPort.send(oscMsg, host, parseInt(port, 10));
      console.log(`  → OSC  ${path}  ${args.length ? JSON.stringify(args[0].value) : "(no args)"}  → ${host}:${port}`);

      ws.send(JSON.stringify({ ok: true, path, host, port }));
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
