import { openDB } from "../../../lib/db";

export default async function handler(req, res) {
  const { path } = req.query;
  const host = req.headers.host.split(":")[0];

  const db = await openDB();

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
