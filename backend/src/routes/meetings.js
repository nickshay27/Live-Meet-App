import { Router } from "express";
import { nanoid } from "nanoid";
import { getPool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

export const meetingsRouter = Router();

meetingsRouter.use(authRequired);

meetingsRouter.get("/", async (req, res) => {
  const pool = getPool();
  try {
    const [rows] = await pool.query(
      "SELECT id, code, title, host_user_id AS hostUserId, created_at AS createdAt FROM meetings WHERE host_user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    return res.json({ meetings: rows });
  } catch (err) {
    console.error("List meetings error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

meetingsRouter.post("/", async (req, res) => {
  const pool = getPool();
  const { title } = req.body;
  const id = nanoid();
  const code = nanoid(6).toUpperCase();
  try {
    await pool.query(
      "INSERT INTO meetings (id, code, title, host_user_id) VALUES (?, ?, ?, ?)",
      [id, code, title || "", req.user.id]
    );
    return res.json({
      meeting: {
        id,
        code,
        title: title || "",
        hostUserId: req.user.id,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("Create meeting error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

meetingsRouter.get("/:code", async (req, res) => {
  const pool = getPool();
  try {
    const [rows] = await pool.query(
      "SELECT id, code, title, host_user_id AS hostUserId, created_at AS createdAt FROM meetings WHERE code = ?",
      [req.params.code]
    );
    if (!rows.length) return res.status(404).json({ message: "Meeting not found" });
    return res.json({ meeting: rows[0] });
  } catch (err) {
    console.error("Get meeting error", err);
    return res.status(500).json({ message: "Server error" });
  }
});
