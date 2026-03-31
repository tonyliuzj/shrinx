import { openDB } from "@/data/database";

export async function getServerSideProps({ params, req }) {
  const { path } = params;
  const requestHost = req.headers.host;
  const host = requestHost.split(":")[0];

  const db = await openDB();
  const row = await db.get(
    "SELECT redirect_url FROM paths WHERE path = ? AND domain IN (?, ?)",
    path,
    requestHost,
    host
  );
  await db.close();

  if (!row) {
    return { notFound: true };
  }

  return {
    redirect: {
      destination: row.redirect_url,
      permanent: false,
    },
  };
}

export default function UrlRedirect() {
  return null;
}
