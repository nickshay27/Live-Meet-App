import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { getPool } from "../db.js";
import { config } from "../config.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const pool = getPool();
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = nanoid();
    await pool.query(
      "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
      [id, name, email, hash]
    );

    const token = jwt.sign({ id }, config.jwtSecret, { expiresIn: "7d" });
    return res.json({
      token,
      user: { id, name, email }
    });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const pool = getPool();
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: "7d" });
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

authRouter.get("/me", async (req, res) => {
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
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json({ user: rows[0] });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});
