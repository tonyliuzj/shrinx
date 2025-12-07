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

  const { currentPassword, newPassword, newUsername } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: "Current password is required" });
  }

  if (!newPassword && !newUsername) {
    return res.status(400).json({ error: "New password or new username is required" });
  }

  const db = await openDB();

  // Verify current password against the logged-in user
  const userRecord = await db.get(
    "SELECT id FROM users WHERE username = ? AND password = ?",
    user.username,
    currentPassword
  );

  if (!userRecord) {
    await db.close();
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  // Update username and/or password
  if (newUsername && newPassword) {
    await db.run(
      "UPDATE users SET username = ?, password = ? WHERE id = ?",
      newUsername,
      newPassword,
      userRecord.id
    );
  } else if (newUsername) {
    await db.run(
      "UPDATE users SET username = ? WHERE id = ?",
      newUsername,
      userRecord.id
    );
  } else if (newPassword) {
    await db.run(
      "UPDATE users SET password = ? WHERE id = ?",
      newPassword,
      userRecord.id
    );
  }

  // Update session with new username if changed
  if (newUsername) {
    req.session.set("user", { ...user, username: newUsername });
    await req.session.save();
  }

  await db.close();
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
