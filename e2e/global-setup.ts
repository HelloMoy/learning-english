/**
 * Fails the run at once, with the fix, when the local stack is not up.
 *
 * Every personal route needs a session, and every session needs the libSQL
 * server from `compose.yaml`. Without this check each spec would time out on
 * its own sign-in and bury the one-line cause under hundreds of failures.
 */
const DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "http://127.0.0.1:8081";

export default async function globalSetup(): Promise<void> {
  if (!DATABASE_URL.startsWith("http")) return;
  try {
    const response = await fetch(`${DATABASE_URL}/health`);
    if (response.ok) return;
  } catch {
    // Falls through to the explanation below.
  }
  throw new Error(
    `The e2e suite needs the local database at ${DATABASE_URL}.\n` +
      "Start it and apply the schema first:\n\n  docker compose up -d && pnpm db:migrate\n",
  );
}
