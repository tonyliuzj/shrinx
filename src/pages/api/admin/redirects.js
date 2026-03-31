import { withSessionRoute } from "../../../lib/session";
import { openDB } from "@/data/database";

export default withSessionRoute(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const db = await openDB();
  try {
    const rows = await db.all("SELECT * FROM paths");
    return res.status(200).json(rows);
  } finally {
    await db.close();
  }
});
