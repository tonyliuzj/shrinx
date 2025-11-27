#!/usr/bin/env node

/**
 * Database Migration Script - Global Turnstile Settings
 * Migrates from per-domain Turnstile to global Turnstile settings
 */

const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function migrate() {
  console.log("🔄 Starting migration to global Turnstile settings...\n");

  const db = await open({
    filename: path.join(process.cwd(), "db.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    // Check if domains table has Turnstile columns (old schema)
    const columns = await db.all("PRAGMA table_info(domains)");
    const columnNames = columns.map((col) => col.name);

    const hasTurnstileColumns =
      columnNames.includes("turnstile_enabled") ||
      columnNames.includes("turnstile_site_key") ||
      columnNames.includes("turnstile_secret_key");

    if (hasTurnstileColumns) {
      console.log("📋 Found per-domain Turnstile columns. Migrating to global settings...");

      // Get the first domain's Turnstile settings to use as global settings
      const firstDomain = await db.get(
        "SELECT turnstile_enabled, turnstile_site_key, turnstile_secret_key FROM domains LIMIT 1"
      );

      // Create settings table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      if (firstDomain) {
        // Migrate to global settings
        const enabled = firstDomain.turnstile_enabled === 1 ? "true" : "false";
        const siteKey = firstDomain.turnstile_site_key || "";
        const secretKey = firstDomain.turnstile_secret_key || "";

        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          "turnstile_enabled",
          enabled
        );
        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          "turnstile_site_key",
          siteKey
        );
        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          "turnstile_secret_key",
          secretKey
        );

        console.log("✅ Migrated Turnstile settings to global configuration");
        console.log(`   - Enabled: ${enabled}`);
        console.log(`   - Site Key: ${siteKey ? "***" + siteKey.slice(-4) : "(empty)"}`);
      } else {
        // No domains exist, create default disabled settings
        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          "turnstile_enabled",
          "false"
        );
        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          "turnstile_site_key",
          ""
        );
        await db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          "turnstile_secret_key",
          ""
        );
        console.log("✅ Created default global Turnstile settings (disabled)");
      }

      // Create new domains table without Turnstile columns
      console.log("\n🔧 Recreating domains table without Turnstile columns...");

      await db.exec(`
        -- Create new domains table
        CREATE TABLE IF NOT EXISTS domains_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Copy data from old table
        INSERT INTO domains_new (id, domain, created_at)
        SELECT id, domain, created_at FROM domains;

        -- Drop old table
        DROP TABLE domains;

        -- Rename new table
        ALTER TABLE domains_new RENAME TO domains;
      `);

      console.log("✅ Successfully recreated domains table");
    } else {
      console.log("✅ Database already using global Turnstile settings");

      // Ensure settings table exists with default values
      await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const settingsExist = await db.get(
        "SELECT key FROM settings WHERE key = 'turnstile_enabled'"
      );

      if (!settingsExist) {
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
        console.log("✅ Created default global Turnstile settings");
      }
    }

    // Ensure users table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure paths table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS paths (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT,
        domain TEXT,
        redirect_url TEXT
      );
    `);

    // Check if default admin user exists
    const adminExists = await db.get(
      "SELECT id FROM users WHERE username = ?",
      "admin"
    );

    if (!adminExists) {
      await db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        "admin",
        "changeme"
      );
      console.log("\n✅ Created default admin user (username: admin, password: changeme)");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   - Turnstile settings are now GLOBAL (apply to all domains)");
    console.log("   - Domains are used for creating separate short URLs");
    console.log("   - Short links work independently per domain");
    console.log("\n📝 Next steps:");
    console.log("   1. Login to admin panel: /login");
    console.log("   2. Default credentials: admin / changeme");
    console.log("   3. Go to /admin/settings to:");
    console.log("      - Change your password");
    console.log("      - Configure global Turnstile settings");
    console.log("      - Add/manage domains for short links");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run migration
migrate()
  .then(() => {
    console.log("\n✨ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
