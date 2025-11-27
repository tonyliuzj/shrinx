import { withSessionRoute } from "../../../lib/session";
import { openDB } from "../../../lib/db";

async function handler(req, res) {
  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = await openDB();

  if (req.method === "GET") {
    // Get global Turnstile settings
    const settings = await db.all("SELECT key, value FROM settings");
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    // Get all domains
    const domains = await db.all("SELECT id, domain FROM domains ORDER BY id");

    await db.close();
    return res.status(200).json({ settings: settingsObj, domains });
  }

  if (req.method === "PUT") {
    // Update global Turnstile settings and primary domain
    const { turnstile_enabled, turnstile_site_key, turnstile_secret_key, primary_domain } =
      req.body;

    await db.run(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      "turnstile_enabled",
      turnstile_enabled ? "true" : "false"
    );

    if (turnstile_site_key !== undefined) {
      await db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        "turnstile_site_key",
        turnstile_site_key
      );
    }

    if (turnstile_secret_key !== undefined) {
      await db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        "turnstile_secret_key",
        turnstile_secret_key
      );
    }

    if (primary_domain !== undefined) {
      await db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        "primary_domain",
        primary_domain
      );
    }

    await db.close();
    return res.status(200).json({ ok: true });
  }

  await db.close();
  return res.status(405).json({ error: "Method not allowed" });
}

export default withSessionRoute(handler);
