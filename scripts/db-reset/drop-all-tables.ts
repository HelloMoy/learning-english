import type { Database } from "@/adapters/persistence/turso/database/database";

import { sql } from "drizzle-orm";

/**
 * Drops every table in the database, Drizzle's migration journal included,
 * so the next `migrate` starts from nothing.
 *
 * @remarks
 * Newest first: tables that reference others are created after them, so
 * dropping in reverse creation order never leaves a dangling reference.
 *
 * @param database - The database to empty
 */
export async function dropAllTables(database: Database): Promise<void> {
  const tables = await database.all<{ name: string }>(
    sql`select name from sqlite_master
        where type = 'table' and name not like 'sqlite_%'
        order by rowid desc`,
  );
  for (const { name } of tables) {
    await database.run(sql.raw(`drop table if exists "${name}"`));
  }
}
