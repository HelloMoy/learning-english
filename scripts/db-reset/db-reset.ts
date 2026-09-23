import { migrate } from "drizzle-orm/libsql/migrator";

import { seedLearner } from "../db-seed/seed-learner";
import { openLocalDatabase } from "../local-database/local-database";
import { dropAllTables } from "./drop-all-tables";

async function main(): Promise<void> {
  const database = openLocalDatabase();
  await dropAllTables(database);
  await migrate(database, { migrationsFolder: "drizzle" });
  await seedLearner(database);
  console.log("Database reset: migrated and seeded.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
