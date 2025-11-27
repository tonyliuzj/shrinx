import { openDB } from "./db";

/**
 * Middleware to enforce primary domain restriction
 * Redirects all requests from non-primary domains to the primary domain
 */
export async function checkPrimaryDomain(req, res) {
  const db = await openDB();

  // Get primary domain setting
  const primaryDomainSetting = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "primary_domain"
  );

  await db.close();

  // If no primary domain is set, allow all domains
  if (!primaryDomainSetting || !primaryDomainSetting.value) {
    return true;
  }

  const primaryDomain = primaryDomainSetting.value;
  const requestHost = req.headers.host;

  // If request is from primary domain, allow it
  if (requestHost === primaryDomain || requestHost.startsWith(primaryDomain + ":")) {
    return true;
  }

  // Otherwise, redirect to primary domain
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const redirectUrl = `${protocol}://${primaryDomain}${req.url}`;

  res.writeHead(301, { Location: redirectUrl });
  res.end();
  return false;
}

/**
 * Wrapper for API routes that enforces primary domain
 */
export function withPrimaryDomain(handler) {
  return async (req, res) => {
    const allowed = await checkPrimaryDomain(req, res);
    if (!allowed) {
      return; // Already redirected
    }
    return handler(req, res);
  };
}
