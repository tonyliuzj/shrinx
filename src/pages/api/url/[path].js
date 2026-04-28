import { openDB } from "@/data/database";
import { hashPassword } from "@/lib/passwordHash";
import {
  REDIRECT_ACCESS_TYPES,
  normalizeRedirectAccessType,
} from "@/lib/redirectOptions";
import {
  getRedirectDomainCandidates,
  shouldRedirectToPrimaryDomain,
} from "@/lib/requestHost";
import { verifyTurnstileToken } from "@/lib/turnstile";

async function loadRedirectForRequest(db, req, path) {
  const requestHost = req.headers.host;

  const primaryDomainSetting = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "primary_domain"
  );

  if (primaryDomainSetting?.value) {
    const primaryDomain = primaryDomainSetting.value;

    if (shouldRedirectToPrimaryDomain(requestHost, primaryDomain)) {
      const protocol = req.headers["x-forwarded-proto"] || "http";

      return {
        primaryRedirect: `${protocol}://${primaryDomain}${req.url}`,
      };
    }
  }

  const primaryDomain = primaryDomainSetting?.value || "";
  const domainCandidates = getRedirectDomainCandidates(requestHost, primaryDomain);
  const domainPlaceholders = domainCandidates.map(() => "?").join(", ");

  const domainExists = await db.get(
    `SELECT id FROM domains WHERE domain IN (${domainPlaceholders})`,
    ...domainCandidates
  );

  if (!domainExists) {
    return { notFound: true };
  }

  const row = await db.get(
    `SELECT redirect_url, access_type, access_password_hash FROM paths WHERE path = ? AND domain IN (${domainPlaceholders})`,
    path.trim(),
    ...domainCandidates
  );

  if (!row) {
    return { notFound: true };
  }

  return { row };
}

export default async function handler(req, res) {
  const { path } = req.query;
  const db = await openDB();

  try {
    const lookup = await loadRedirectForRequest(db, req, path);

    if (lookup.primaryRedirect) {
      return res.redirect(301, lookup.primaryRedirect);
    }

    if (lookup.notFound) {
      return res.status(404).json({ message: "Redirect not found." });
    }

    const accessType = normalizeRedirectAccessType(lookup.row.access_type);

    if (req.method === "GET") {
      if (accessType === REDIRECT_ACCESS_TYPES.SIMPLE) {
        return res.redirect(lookup.row.redirect_url);
      }

      return res.status(405).json({
        message: "Protected redirects must be completed from the public link page.",
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed." });
    }

    if (accessType === REDIRECT_ACCESS_TYPES.PASSWORD) {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          message: "Password is required for this redirect.",
        });
      }
    }

    const usesTurnstile =
      accessType === REDIRECT_ACCESS_TYPES.CAPTCHA ||
      accessType === REDIRECT_ACCESS_TYPES.PASSWORD;

    if (usesTurnstile) {
      const [siteKey, secretKey] = await Promise.all([
        db.get("SELECT value FROM settings WHERE key = ?", "turnstile_site_key"),
        db.get(
          "SELECT value FROM settings WHERE key = ?",
          "turnstile_secret_key"
        ),
      ]);
      const turnstileConfigured =
        Boolean(siteKey?.value) && Boolean(secretKey?.value);

      if (!turnstileConfigured) {
        if (accessType === REDIRECT_ACCESS_TYPES.CAPTCHA) {
          return res.status(500).json({
            message: "Cloudflare Turnstile is not configured for this redirect.",
          });
        }
      } else {
        const { turnstileResponse } = req.body;

        if (!turnstileResponse) {
          return res.status(400).json({
            message:
              accessType === REDIRECT_ACCESS_TYPES.PASSWORD
                ? "Complete the captcha before trying the password."
                : "Complete the captcha before continuing.",
          });
        }

        const verification = await verifyTurnstileToken({
          secretKey: secretKey.value,
          response: turnstileResponse,
        });

        if (!verification.ok) {
          return res.status(400).json({
            message: verification.message,
            errors: verification.errors,
          });
        }
      }
    }

    if (accessType === REDIRECT_ACCESS_TYPES.PASSWORD) {
      if (hashPassword(req.body.password) !== lookup.row.access_password_hash) {
        return res.status(401).json({ message: "Incorrect password." });
      }
    }

    return res.status(200).json({ redirectUrl: lookup.row.redirect_url });
  } finally {
    await db.close();
  }
}
