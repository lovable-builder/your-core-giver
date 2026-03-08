const WebSocket = require('ws');
const osc = require('osc');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  ws.on('message', msg => {
    const { path, value, host, port } = JSON.parse(msg);
    const udp = new osc.UDPPort({ remoteAddress: host, remotePort: parseInt(port) });
    udp.open();
    udp.on('ready', () => {
      udp.send({ address: path, args: value ? [{ type: 'f', value: parseFloat(value) || 0 }] : [] });
      udp.close();
    });
  });
});

console.log('OSC Bridge running on ws://localhost:8080');
