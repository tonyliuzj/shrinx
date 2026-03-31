import { withSessionRoute } from "../../../lib/session";
import { openDB } from "@/data/database";

export default withSessionRoute(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: "Missing id parameter" });
  }

  const db = await openDB();
  try {
    await db.run("DELETE FROM paths WHERE id = ?", id);
    return res.status(200).json({ ok: true });
  } finally {
    await db.close();
  }
});
