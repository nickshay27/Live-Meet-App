import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { meetingsRouter } from "./routes/meetings.js";
import { initDb } from "./db.js";

export async function createApp() {
  await initDb();
  const app = express();

  const allowedOrigins = [
    "http://localhost:5173",                // Local dev
    process.env.FRONTEND_URL,              // Vercel frontend
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);  // mobile apps, Postman, curl

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log("❌ CORS Reject:", origin);
          callback(new Error("Not allowed by CORS"), false);
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/meetings", meetingsRouter);

  return app;
}
