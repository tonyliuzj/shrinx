import { withSessionRoute } from "../../../lib/session";
import { openDB } from "../../../lib/db";

export default withSessionRoute(async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  const db = await openDB();
  const user = await db.get(
    "SELECT id, username FROM users WHERE username = ? AND password = ?",
    username,
    password
  );
  await db.close();

  if (user) {
    req.session.set("user", { isLoggedIn: true, username: user.username });
    await req.session.save();
    return res.status(200).json({ ok: true });
  }

  res.status(401).json({ message: "Invalid credentials" });
});
