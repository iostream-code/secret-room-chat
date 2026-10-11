import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { config } from "./config.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";
import { startSweeper } from "./rooms/roomManager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/healthz", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

registerSocketHandlers(io);
startSweeper();

httpServer.listen(config.port, () => {
  console.log(`secret-room-chat listening on http://localhost:${config.port}`);
});
