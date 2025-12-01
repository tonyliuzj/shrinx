import { withSessionRoute } from "../../../lib/session";
import { openDB } from "../../../lib/db";

async function handler(req, res) {
  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { currentPassword, newPassword, username } = req.body;

  if (!currentPassword || !newPassword || !username) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Verify that the user is changing their own password
  if (user.username !== username) {
    return res.status(403).json({ error: "Cannot change another user's password" });
  }

  const db = await openDB();

  // Verify current password
  const userRecord = await db.get(
    "SELECT id FROM users WHERE username = ? AND password = ?",
    username,
    currentPassword
  );

  if (!userRecord) {
    await db.close();
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  // Update password
  await db.run(
    "UPDATE users SET password = ? WHERE username = ?",
    newPassword,
    username
  );

  await db.close();
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
