import { openDB } from "@/data/database";
import { hashPassword } from "@/lib/passwordHash";
import { REDIRECT_ACCESS_TYPES, validateRedirectAccessInput } from "@/lib/redirectOptions";
import { verifyTurnstileToken } from "@/lib/turnstile";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { path, domain, redirectUrl, turnstileResponse, accessType, accessPassword } =
    req.body;

  if (!path || !domain || !redirectUrl) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const db = await openDB();

  // Get global Turnstile settings
  const turnstileEnabled = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "turnstile_enabled"
  );

  // Only verify Turnstile if it's enabled globally
  if (turnstileEnabled?.value === "true") {
    if (!turnstileResponse) {
      await db.close();
      return res.status(400).json({ message: "Missing Turnstile token." });
    }

    const secretKey = await db.get(
      "SELECT value FROM settings WHERE key = ?",
      "turnstile_secret_key"
    );

    if (!secretKey?.value) {
      await db.close();
      console.error("🚨 TURNSTILE_SECRET_KEY is not configured in settings");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const verification = await verifyTurnstileToken({
      secretKey: secretKey.value,
      response: turnstileResponse,
    });

    if (!verification.ok) {
      await db.close();
      console.warn("Turnstile failed:", verification.errors);
      return res.status(400).json({
        message: verification.message,
        errors: verification.errors,
      });
    }
  }

  try {
    const accessValidation = validateRedirectAccessInput({
      accessType,
      accessPassword,
    });

    if (!accessValidation.valid) {
      await db.close();
      return res.status(400).json({ message: accessValidation.error });
    }

    if (accessValidation.accessType === REDIRECT_ACCESS_TYPES.CAPTCHA) {
      const turnstileSettings = await db.all(
        "SELECT key, value FROM settings WHERE key IN (?, ?)",
        "turnstile_site_key",
        "turnstile_secret_key"
      );
      const settingsMap = Object.fromEntries(
        turnstileSettings.map((entry) => [entry.key, entry.value])
      );

      if (!settingsMap.turnstile_site_key || !settingsMap.turnstile_secret_key) {
        await db.close();
        return res.status(400).json({
          message:
            "Configure Cloudflare Turnstile site and secret keys before using captcha-protected redirects.",
        });
      }
    }

    const existing = await db.get(
      "SELECT * FROM paths WHERE path = ? AND domain = ?",
      path.trim(),
      domain
    );
    if (existing) {
      await db.close();
      return res
        .status(400)
        .json({ message: "That short URL is already taken." });
    }

    await db.run(
      "INSERT INTO paths (path, domain, redirect_url, access_type, access_password_hash) VALUES (?, ?, ?, ?, ?)",
      path.trim(),
      domain,
      redirectUrl.trim(),
      accessValidation.accessType,
      accessValidation.accessType === REDIRECT_ACCESS_TYPES.PASSWORD
        ? hashPassword(accessPassword)
        : null
    );

    await db.close();
    return res.status(200).json({ ok: true });
  } catch (err) {
    await db.close();
    console.error("Error saving URL:", err);
    return res.status(500).json({ message: "Error saving URL." });
  }
}
