// RENTINGIT Chat WebSocket Service
// Runs on port 3003. Frontend connects via `io("/?XTransformPort=3003")`
// Caddy gateway routes the request to this port based on XTransformPort query param.

import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3003;

const httpServer = createServer((req, res) => {
  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "rentingit-chat", port: PORT }));
    return;
  }
  // Internal broadcast endpoint — called by Next.js API when a new message is saved
  if (req.url === "/broadcast" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { conversationId, message } = JSON.parse(body);
        io.to(`conv:${conversationId}`).emit("message:new", message);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end("Bad JSON");
      }
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/",
});

io.on("connection", (socket) => {
  console.log(`[chat] connected: ${socket.id}`);

  // Client sends: { conversationId, userId }
  socket.on("conversation:join", ({ conversationId, userId }) => {
    if (!conversationId || !userId) return;
    socket.join(`conv:${conversationId}`);
    socket.data = { conversationId, userId };
    console.log(`[chat] ${userId} joined conv ${conversationId}`);
  });

  socket.on("conversation:leave", ({ conversationId }) => {
    socket.leave(`conv:${conversationId}`);
  });

  // Typing indicator
  socket.on("typing:start", ({ conversationId, userId, userName }) => {
    socket.to(`conv:${conversationId}`).emit("typing:start", { userId, userName });
  });

  socket.on("typing:stop", ({ conversationId, userId }) => {
    socket.to(`conv:${conversationId}`).emit("typing:stop", { userId });
  });

  socket.on("disconnect", () => {
    console.log(`[chat] disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[rentingit-chat] WebSocket service listening on port ${PORT}`);
});
