// @vitest-environment node
import { user } from "@/adapters/persistence/turso/schema/schema";
import { createAuth } from "@/lib/auth/auth";
import {
  DOCKER_AVAILABLE,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { okAsync } from "neverthrow";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { SEED_LEARNER, seedLearner } from "./seed-learner";

describe.skipIf(!DOCKER_AVAILABLE)("seedLearner (integration)", () => {
  let libsql: StartedLibsql;

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("creates a verified learner who can sign in with the documented password", async () => {
    await seedLearner(libsql.database);
    const auth = createAuth({
      database: libsql.database,
      emailSender: { send: () => okAsync(undefined) },
      secret: "x".repeat(32),
      baseURL: "http://localhost:3000",
      google: { clientId: "id", clientSecret: "secret" },
      captcha: { secretKey: "secret" },
      rateLimited: false,
    });

    const session = await auth.api.signInEmail({
      body: { email: SEED_LEARNER.email, password: SEED_LEARNER.password },
    });

    expect(session.user.email).toBe(SEED_LEARNER.email);
    expect(session.user.emailVerified).toBe(true);
  });

  test("is idempotent", async () => {
    await seedLearner(libsql.database);
    await seedLearner(libsql.database);

    expect(await libsql.database.$count(user)).toBe(1);
  });
});
