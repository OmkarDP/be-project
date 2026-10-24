import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { runBookMyShowAutomation } from "../../playwright/automation/bookmyshow.js";
import { runRedBusAutomation } from "../../playwright/automation/redbus.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "connected", message: "Connected to Automation Hub live runner." }));

  ws.on("close", () => {
    clients.delete(ws);
  });
});

function broadcast(data: any) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

let isRunning = false;

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", running: isRunning });
});

app.post("/api/run", async (req, res) => {
  const { platform, params } = req.body;

  if (isRunning) {
    return res.status(409).json({ error: "Another automation is currently running. Please wait." });
  }

  if (platform !== "bookmyshow" && platform !== "redbus") {
    return res.status(400).json({ error: "Invalid platform. Must be 'bookmyshow' or 'redbus'." });
  }

  isRunning = true;
  broadcast({
    type: "start",
    platform,
    timestamp: new Date().toLocaleTimeString(),
    message: `Starting ${platform.toUpperCase()} automation with parameters: ${JSON.stringify(params)}`,
  });

  // Respond immediately so client can follow along via WebSocket / stream
  res.json({ ok: true, platform, message: "Automation triggered." });

  const onLog = (msg: string, level: "info" | "success" | "warn" | "error" = "info") => {
    console.log(`[${platform.toUpperCase()}] ${msg}`);
    broadcast({
      type: "log",
      platform,
      level,
      timestamp: new Date().toLocaleTimeString(),
      text: msg,
    });
  };

  try {
    if (platform === "bookmyshow") {
      const result = await runBookMyShowAutomation(params || {}, onLog);
      broadcast({
        type: "finish",
        platform,
        status: "success",
        timestamp: new Date().toLocaleTimeString(),
        result,
      });
    } else if (platform === "redbus") {
      const result = await runRedBusAutomation(params || {}, onLog);
      broadcast({
        type: "finish",
        platform,
        status: "success",
        timestamp: new Date().toLocaleTimeString(),
        result,
      });
    }
  } catch (err: any) {
    broadcast({
      type: "finish",
      platform,
      status: "error",
      timestamp: new Date().toLocaleTimeString(),
      error: err.message,
    });
  } finally {
    isRunning = false;
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✨ Automation Hub server is running at http://localhost:${PORT}`);
});
