import { openDB } from "../../lib/db";

export default async function handler(req, res) {
  const db = await openDB();
  const domainsData = await db.all("SELECT domain FROM domains ORDER BY id");
  await db.close();

  const domains = domainsData.map((d) => d.domain);
  res.status(200).json({ domains });
}
