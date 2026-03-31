import fs from "fs/promises";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DEFAULT_DATABASE_PATH = path.join("data", "link-guide.sqlite");
const LEGACY_DATABASE_PATH = path.join(process.cwd(), "db.sqlite");

function resolveDatabasePath() {
  const configuredPath = process.env.DATABASE_PATH?.trim();

  if (!configuredPath) {
    return path.join(process.cwd(), DEFAULT_DATABASE_PATH);
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function moveLegacyDatabaseIfNeeded(databasePath) {
  if (
    databasePath === LEGACY_DATABASE_PATH ||
    !(await pathExists(LEGACY_DATABASE_PATH)) ||
    (await pathExists(databasePath))
  ) {
    return;
  }

  try {
    await fs.rename(LEGACY_DATABASE_PATH, databasePath);
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }

    await fs.copyFile(LEGACY_DATABASE_PATH, databasePath);
    await fs.unlink(LEGACY_DATABASE_PATH);
  }
}

function getDefaultSettings() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() || "";
  const configuredTurnstile = process.env.TURNSTILE_ENABLED?.trim().toLowerCase();
  const domains = (process.env.DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);

  return {
    settings: {
      turnstile_enabled:
        configuredTurnstile === "true"
          ? "true"
          : configuredTurnstile === "false"
            ? "false"
            : siteKey && secretKey
              ? "true"
              : "false",
      turnstile_site_key: siteKey,
      turnstile_secret_key: secretKey,
      primary_domain: process.env.PRIMARY_DOMAIN?.trim() || domains[0] || "",
    },
    domains,
    admin: {
      username: process.env.ADMIN_USERNAME?.trim() || "admin",
      password: process.env.ADMIN_PASSWORD || "changeme",
    },
  };
}

async function ensureDatabaseFile() {
  const databasePath = resolveDatabasePath();

  await fs.mkdir(path.dirname(databasePath), { recursive: true });
  await moveLegacyDatabaseIfNeeded(databasePath);

  return databasePath;
}

async function seedDefaults(db) {
  const defaults = getDefaultSettings();

  const userCount = await db.get("SELECT COUNT(*) AS count FROM users");
  if (!userCount?.count) {
    await db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      defaults.admin.username,
      defaults.admin.password
    );
  }

  for (const [key, value] of Object.entries(defaults.settings)) {
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      key,
      value
    );
  }

  const domainCount = await db.get("SELECT COUNT(*) AS count FROM domains");
  if (!domainCount?.count && defaults.domains.length > 0) {
    for (const domain of defaults.domains) {
      await db.run("INSERT OR IGNORE INTO domains (domain) VALUES (?)", domain);
    }
  }
}

async function ensureColumn(db, table, column, definition) {
  const columns = await db.all(`PRAGMA table_info(${table})`);

  if (!columns.some((entry) => entry.name === column)) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function openDB() {
  const filename = await ensureDatabaseFile();
  const db = await open({
    filename,
    driver: sqlite3.Database,
  });

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

  await ensureColumn(db, "paths", "access_type", "TEXT DEFAULT 'simple'");
  await ensureColumn(db, "paths", "access_password_hash", "TEXT");
  await db.run(
    "UPDATE paths SET access_type = 'simple' WHERE access_type IS NULL OR access_type = ''"
  );
  await db.run(
    "UPDATE paths SET access_password_hash = NULL WHERE access_type != 'password'"
  );

  await seedDefaults(db);

  return db;
}
