import { openDB } from "../../../lib/db";

export default async function handler(req, res) {
  const { path } = req.query;
  const requestHost = req.headers.host;
  const host = requestHost.split(":")[0];

  const db = await openDB();

  // Check primary domain restriction
  const primaryDomainSetting = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "primary_domain"
  );

  // If primary domain is set and request is not from primary domain, redirect
  if (primaryDomainSetting && primaryDomainSetting.value) {
    const primaryDomain = primaryDomainSetting.value;
    if (requestHost !== primaryDomain && !requestHost.startsWith(primaryDomain + ":")) {
      await db.close();
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const redirectUrl = `${protocol}://${primaryDomain}${req.url}`;
      return res.redirect(301, redirectUrl);
    }
  }

  // Check if host is in allowed domains
  const domainExists = await db.get(
    "SELECT id FROM domains WHERE domain = ?",
    host
  );

  if (!domainExists) {
    await db.close();
    return res.status(404).end();
  }

  const row = await db.get(
    "SELECT redirect_url FROM paths WHERE path = ? AND domain = ?",
    path.trim(),
    host
  );

  await db.close();

  if (!row) {
    return res.redirect("/error");
  }

  res.redirect(row.redirect_url);
}
