#!/usr/bin/env node
/**
 * EOS AI — Local OSC Bridge Server
 * Run: npm install ws osc && node bridge.js
 */

const { Server: WebSocketServer } = require("ws");
const osc = require("osc");

const WS_PORT = parseInt(process.env.PORT || "8080", 10);
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`\n⚡ EOS AI OSC Bridge`);
console.log(`  WebSocket listening on ws://localhost:${WS_PORT}`);
console.log(`  Waiting for connections...\n`);

const udpPort = new osc.UDPPort({ localAddress: "0.0.0.0", localPort: 0 });
udpPort.open();
udpPort.on("ready", () => console.log(`  UDP sender ready on port ${udpPort.options.localPort}`));
udpPort.on("error", (err) => console.error("  UDP error:", err.message));

function parseEosCommand(path, value) {
  const prefix = "/eos/newcmd/";

  // If user sent human-readable command with spaces, convert to /eos/newcmd + string arg.
  // If it's already tokenized (slash-separated), pass through unchanged.
  if (path.startsWith(prefix) && path.length > prefix.length) {
    const suffix = path.slice(prefix.length);
    if (suffix.includes(" ")) {
      return {
        address: "/eos/newcmd",
        args: [{ type: "s", value: suffix }],
      };
    }
    return { address: path, args: [] };
  }

  const args = [];
  if (value !== undefined && value !== null && value !== "") {
    const num = Number(value);
    args.push(!isNaN(num) ? { type: "f", value: num } : { type: "s", value: String(value) });
  }
  return { address: path, args };
}

wss.on("connection", (ws, req) => {
  console.log(`✓ Client connected from ${req.headers.origin || "unknown"}`);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "ping") {
        udpPort.send({ address: "/eos/get/version", args: [] }, msg.host || "127.0.0.1", parseInt(msg.port || "3032", 10));
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }
      if (msg.type === "request_patch") {
        udpPort.send({ address: "/eos/get/patch/count", args: [] }, msg.host || "127.0.0.1", parseInt(msg.port || "3032", 10));
        ws.send(JSON.stringify({ ok: true, info: "Patch dump requested" }));
        return;
      }
      if (msg.type === "request_levels") {
        udpPort.send({ address: "/eos/get/chans/1/100", args: [] }, msg.host || "127.0.0.1", parseInt(msg.port || "3032", 10));
        ws.send(JSON.stringify({ ok: true, info: "Levels requested" }));
        return;
      }

      const { path, value, host, port } = msg;
      if (!path || !host || !port) {
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

  ws.on("close", () => console.log("✗ Client disconnected"));
});

process.on("SIGINT", () => { wss.close(); udpPort.close(); process.exit(0); });
