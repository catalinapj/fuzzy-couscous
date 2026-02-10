const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    // broadcast to everyone
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(raw.toString());
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
