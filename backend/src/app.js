import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { meetingsRouter } from "./routes/meetings.js";
import { initDb } from "./db.js";

export async function createApp() {
  await initDb();
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true
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
