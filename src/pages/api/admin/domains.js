import { withSessionRoute } from "../../../lib/session";
import { openDB } from "../../../lib/db";

async function handler(req, res) {
  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = await openDB();

  if (req.method === "POST") {
    // Add a new domain
    const { domain } = req.body;

    if (!domain) {
      await db.close();
      return res.status(400).json({ error: "Domain is required" });
    }

    try {
      await db.run("INSERT INTO domains (domain) VALUES (?)", domain);
      await db.close();
      return res.status(200).json({ ok: true });
    } catch (error) {
      await db.close();
      return res.status(400).json({ error: "Domain already exists" });
    }
  }

  if (req.method === "DELETE") {
    // Delete a domain
    const { id } = req.body;

    if (!id) {
      await db.close();
      return res.status(400).json({ error: "Domain ID is required" });
    }

    await db.run("DELETE FROM domains WHERE id = ?", id);
    await db.close();
    return res.status(200).json({ ok: true });
  }

  await db.close();
  return res.status(405).json({ error: "Method not allowed" });
}

export default withSessionRoute(handler);
