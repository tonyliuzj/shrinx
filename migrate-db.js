#!/usr/bin/env node

/**
 * Database Migration Script
 * Migrates existing database to support per-domain Turnstile settings
 */

const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function migrate() {
  console.log("🔄 Starting database migration...\n");

  const db = await open({
    filename: path.join(process.cwd(), "db.sqlite"),
    driver: sqlite3.Database,
  });

  try {
    // Check if domains table exists
    const domainsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='domains'"
    );

    if (!domainsTable) {
      console.log("✅ No existing domains table found. Creating new schema...");

      // Create fresh domains table with Turnstile fields
      await db.exec(`
        CREATE TABLE IF NOT EXISTS domains (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain TEXT UNIQUE NOT NULL,
          turnstile_enabled INTEGER DEFAULT 0,
          turnstile_site_key TEXT DEFAULT '',
          turnstile_secret_key TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("✅ Created domains table with Turnstile fields");
    } else {
      console.log("📋 Existing domains table found. Checking columns...");

      // Check if turnstile columns exist
      const columns = await db.all("PRAGMA table_info(domains)");
      const columnNames = columns.map((col) => col.name);

      const hasTurnstileEnabled = columnNames.includes("turnstile_enabled");
      const hasTurnstileSiteKey = columnNames.includes("turnstile_site_key");
      const hasTurnstileSecretKey = columnNames.includes("turnstile_secret_key");

      if (hasTurnstileEnabled && hasTurnstileSiteKey && hasTurnstileSecretKey) {
        console.log("✅ Database already has Turnstile columns. No migration needed.");
      } else {
        console.log("🔧 Adding Turnstile columns to domains table...");

        // SQLite doesn't support adding multiple columns at once
        if (!hasTurnstileEnabled) {
          await db.exec(
            "ALTER TABLE domains ADD COLUMN turnstile_enabled INTEGER DEFAULT 0"
          );
          console.log("  ✓ Added turnstile_enabled column");
        }

        if (!hasTurnstileSiteKey) {
          await db.exec(
            "ALTER TABLE domains ADD COLUMN turnstile_site_key TEXT DEFAULT ''"
          );
          console.log("  ✓ Added turnstile_site_key column");
        }

        if (!hasTurnstileSecretKey) {
          await db.exec(
            "ALTER TABLE domains ADD COLUMN turnstile_secret_key TEXT DEFAULT ''"
          );
          console.log("  ✓ Added turnstile_secret_key column");
        }

        console.log("✅ Successfully added Turnstile columns");
      }
    }

    // Check and migrate from old settings table if it exists
    const settingsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
    );

    if (settingsTable) {
      console.log("\n📋 Found old settings table. Checking for migration...");

      const oldSettings = await db.all("SELECT key, value FROM settings");
      const settingsMap = {};
      oldSettings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      if (
        settingsMap.turnstile_enabled ||
        settingsMap.turnstile_site_key ||
        settingsMap.turnstile_secret_key
      ) {
        console.log("🔄 Migrating global Turnstile settings to domains...");

        // Get all domains
        const domains = await db.all("SELECT id, domain FROM domains");

        if (domains.length > 0) {
          const enabled = settingsMap.turnstile_enabled === "true" ? 1 : 0;
          const siteKey = settingsMap.turnstile_site_key || "";
          const secretKey = settingsMap.turnstile_secret_key || "";

          for (const domain of domains) {
            await db.run(
              "UPDATE domains SET turnstile_enabled = ?, turnstile_site_key = ?, turnstile_secret_key = ? WHERE id = ?",
              enabled,
              siteKey,
              secretKey,
              domain.id
            );
            console.log(`  ✓ Migrated settings to domain: ${domain.domain}`);
          }

          console.log("✅ Successfully migrated Turnstile settings to all domains");
        }

        // Drop old settings table
        console.log("🗑️  Removing old settings table...");
        await db.exec("DROP TABLE IF EXISTS settings");
        console.log("✅ Removed old settings table");
      } else {
        console.log("ℹ️  No Turnstile settings found in old settings table");
        // Still drop the settings table as it's no longer needed
        await db.exec("DROP TABLE IF EXISTS settings");
        console.log("✅ Removed old settings table");
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

    console.log("\n✅ Database migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Login to admin panel: /login");
    console.log("   2. Default credentials: admin / changeme");
    console.log("   3. Go to /admin/settings to:");
    console.log("      - Change your password");
    console.log("      - Add domains");
    console.log("      - Configure per-domain Turnstile settings");
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
