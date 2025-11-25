import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getPool } from "../db.js";

export async function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });

  const [, token] = header.split(" ");
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const pool = getPool();
    const [rows] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [
      payload.id
    ]);
    if (!rows.length) return res.status(401).json({ message: "User not found" });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
