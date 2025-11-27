import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDB() {
  const db = await open({
    filename: path.join(process.cwd(), "db.sqlite"),
    driver: sqlite3.Database,
  });

  // Initialize tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS paths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT,
      domain TEXT,
      redirect_url TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if default admin user exists
  const adminExists = await db.get(
    "SELECT id FROM users WHERE username = ?",
    "admin"
  );

  if (!adminExists) {
    // Create default admin user (password: changeme)
    await db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      "admin",
      "changeme"
    );

    // Insert default global Turnstile settings
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      "turnstile_enabled",
      "false"
    );
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      "turnstile_site_key",
      ""
    );
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      "turnstile_secret_key",
      ""
    );
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      "primary_domain",
      ""
    );
  }

  return db;
}
