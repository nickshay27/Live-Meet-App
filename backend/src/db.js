import mysql from "mysql2/promise";
import { config } from "./config.js";

let pool;

export async function initDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      port: config.db.port || 4000,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,

      // 🔥 REQUIRED for TiDB Cloud — ENABLE SSL
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        title VARCHAR(255),
        host_user_id VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_user_id) REFERENCES users(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meeting_id VARCHAR(50),
        user_id VARCHAR(50),
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        left_at DATETIME,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meeting_id VARCHAR(50),
        user_id VARCHAR(50),
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } finally {
    conn.release();
  }
}

export function getPool() {
  if (!pool) {
    throw new Error("DB pool not initialized. Call initDb() first.");
  }
  return pool;
}
