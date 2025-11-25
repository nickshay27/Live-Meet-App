import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createApp } from "./src/app.js";
import { config } from "./src/config.js";
import { getPool } from "./src/db.js";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  const app = await createApp();
  const server = http.createServer(app);

  // 👇 Allowed origins (local + production frontend)
  const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,            // << add this in Render env
  ].filter(Boolean);

  console.log("Allowed Origins for Socket.IO:", allowedOrigins);

  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Postman, mobile, curl

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log("❌ Socket.IO CORS Reject:", origin);
          callback(new Error("Not allowed by CORS"), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    const { token } = socket.handshake.auth || {};
    if (!token) return next(new Error("Missing token"));
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const pool = getPool();
      const [rows] = await pool.query("SELECT id, name FROM users WHERE id = ?", [
        payload.id
      ]);
      if (!rows.length) return next(new Error("User not found"));
      socket.user = { id: rows[0].id, name: rows[0].name };
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  const rooms = new Map();

  io.on("connection", (socket) => {
    socket.on("join-room", ({ code }) => {
      socket.join(code);
      const roomUsers = rooms.get(code) || new Map();
      roomUsers.set(socket.id, {
        socketId: socket.id,
        userId: socket.user.id,
        name: socket.user.name
      });
      rooms.set(code, roomUsers);

      io.to(socket.id).emit("room-users", {
        users: Array.from(roomUsers.values())
      });

      socket.to(code).emit("user-joined", {
        user: { socketId: socket.id, userId: socket.user.id, name: socket.user.name }
      });
    });

    socket.on("leave-room", ({ code }) => {
      socket.leave(code);
      const roomUsers = rooms.get(code);
      if (roomUsers) {
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) rooms.delete(code);
      }
      socket.to(code).emit("user-left", { socketId: socket.id });
    });

    socket.on("webrtc-offer", ({ to, offer }) => {
      io.to(to).emit("webrtc-offer", { from: socket.id, offer });
    });

    socket.on("webrtc-answer", ({ to, answer }) => {
      io.to(to).emit("webrtc-answer", { from: socket.id, answer });
    });

    socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
    });

    socket.on("chat-message", ({ code, message }) => {
      socket.to(code).emit("chat-message", message);
    });

    socket.on("disconnecting", () => {
      for (const code of socket.rooms) {
        if (code === socket.id) continue;
        const roomUsers = rooms.get(code);
        if (roomUsers) {
          roomUsers.delete(socket.id);
          if (roomUsers.size === 0) rooms.delete(code);
        }
        socket.to(code).emit("user-left", { socketId: socket.id });
      }
    });
  });

  server.listen(config.port, () => {
    console.log("Server listening on port", config.port);
  });
};

start();
