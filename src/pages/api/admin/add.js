import { withSessionRoute } from "../../../lib/session";
import { openDB } from "@/data/database";
import { hashPassword } from "@/lib/passwordHash";
import { REDIRECT_ACCESS_TYPES, validateRedirectAccessInput } from "@/lib/redirectOptions";

export default withSessionRoute(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { path, domain, redirectUrl, accessType, accessPassword } = req.body;
  if (!path || !domain || !redirectUrl) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const db = await openDB();
  try {
    const accessValidation = validateRedirectAccessInput({
      accessType,
      accessPassword,
    });

    if (!accessValidation.valid) {
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
        return res.status(400).json({
          message:
            "Configure Cloudflare Turnstile site and secret keys before using captcha-protected redirects.",
        });
      }
    }

    await db.run(
      "INSERT INTO paths (path, domain, redirect_url, access_type, access_password_hash) VALUES (?, ?, ?, ?, ?)",
      path.trim(),
      domain.trim(),
      redirectUrl.trim(),
      accessValidation.accessType,
      accessValidation.accessType === REDIRECT_ACCESS_TYPES.PASSWORD
        ? hashPassword(accessPassword)
        : null
    );

    return res.status(200).json({ ok: true });
  } finally {
    await db.close();
  }
});
