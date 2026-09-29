// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  applyAllMigrations,
  DOCKER_AVAILABLE,
  insertTestUser,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";

type StoredLocation = { course_slug: string; module_slug: string; lesson_id: string };

const MIGRATIONS_FOLDER = path.resolve(__dirname, "../../../../../drizzle");

// The backfill's statements, read from the migration file itself so the test
// exercises exactly what `drizzle-kit migrate` runs.
function backfillStatements(): string[] {
  const file = readdirSync(MIGRATIONS_FOLDER).find((name) =>
    name.endsWith("_enroll_existing_learners.sql"),
  );
  if (!file) throw new Error("The enroll-existing-learners migration is missing");
  return readFileSync(path.join(MIGRATIONS_FOLDER, file), "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

/**
 * Guards the data the `course-enrollment` migrations carry over: they run once
 * against databases that already hold learners, which a fresh container never
 * shows.
 */
describe.skipIf(!DOCKER_AVAILABLE)("course-enrollment migrations (integration)", () => {
  let libsql: StartedLibsql | undefined;

  afterEach(async () => {
    await libsql?.stop();
    libsql = undefined;
  });

  async function insertLocation(userId: string, courseSlug: string): Promise<StoredLocation> {
    const location = {
      course_slug: courseSlug,
      module_slug: "2-vowels",
      lesson_id: faker.string.uuid(),
    };
    await libsql!.database.run(
      sql`insert into continue_watching (user_id, course_slug, module_slug, lesson_id)
          values (${userId}, ${location.course_slug}, ${location.module_slug}, ${location.lesson_id})`,
    );
    return location;
  }

  test("a location stored before the re-key survives it", async () => {
    libsql = await startLibsqlContainer({ throughMigration: "0002_learner_rewards" });
    const userId = await insertTestUser(libsql.database);
    const location = await insertLocation(userId, "basic-course");

    await applyAllMigrations(libsql.database);

    const rows = await libsql.database.all<StoredLocation>(
      sql`select course_slug, module_slug, lesson_id from continue_watching where user_id = ${userId}`,
    );
    expect(rows).toEqual([location]);
  }, 180_000);

  async function enrollmentsOf(userId: string): Promise<string[]> {
    const rows = await libsql!.database.all<{ course_slug: string }>(
      sql`select course_slug from course_enrollment where user_id = ${userId} order by course_slug`,
    );
    return rows.map((row) => row.course_slug);
  }

  test("every existing account is enrolled in the Basic Course", async () => {
    libsql = await startLibsqlContainer({ throughMigration: "0003_course_enrollment" });
    const userId = await insertTestUser(libsql.database);

    await applyAllMigrations(libsql.database);

    expect(await enrollmentsOf(userId)).toEqual(["basic-course"]);
  }, 180_000);

  test("a tester of the Advanced draft keeps that course too", async () => {
    libsql = await startLibsqlContainer({ throughMigration: "0003_course_enrollment" });
    const userId = await insertTestUser(libsql.database);
    await insertLocation(userId, "advanced-intermediate-course");

    await applyAllMigrations(libsql.database);

    expect(await enrollmentsOf(userId)).toEqual(["advanced-intermediate-course", "basic-course"]);
  }, 180_000);

  test("running the backfill twice adds nothing", async () => {
    libsql = await startLibsqlContainer({ throughMigration: "0003_course_enrollment" });
    const userId = await insertTestUser(libsql.database);
    await applyAllMigrations(libsql.database);

    for (const statement of backfillStatements()) await libsql.database.run(sql.raw(statement));

    expect(await enrollmentsOf(userId)).toEqual(["basic-course"]);
  }, 180_000);

  test("an account created after the backfill starts with no enrollment", async () => {
    libsql = await startLibsqlContainer();

    const userId = await insertTestUser(libsql.database);

    expect(await enrollmentsOf(userId)).toEqual([]);
  }, 180_000);
});
