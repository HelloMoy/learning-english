// @vitest-environment node
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { SmtpEmailSender } from "@/adapters/email/smtp-email-sender/smtp-email-sender";
import {
  account,
  continueWatching,
  earnedTicket,
  LEARNER_TABLES,
  learnerProfile,
  lessonCompletion,
  playbackPosition,
  prizeClaim,
  rateLimit,
  session,
  user,
} from "@/adapters/persistence/turso/schema/schema";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";
import {
  DOCKER_AVAILABLE,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";
import {
  startMailpitContainer,
  type StartedMailpit,
} from "@/test-setup/mailpit-container/mailpit-container";

import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { createAuth, type Auth } from "./auth";

/**
 * Drives Better Auth through its real HTTP handler, against a real libSQL
 * server and a real SMTP inbox. Going through `handler` rather than
 * `auth.api.*` matters: request plugins such as the captcha only run there.
 *
 * The one stand-in is Cloudflare's siteverify endpoint, replaced by a local
 * server that passes the token `pass` — third-party network calls do not
 * belong in a suite that must be repeatable offline.
 */

const BASE_URL = "http://localhost:3000";
const PASSING_TOKEN = "pass";

/**
 * Every test here signs in at least once, and each sign-in hashes a password
 * and crosses two containers. Vitest's 5-second default times that against
 * the machine's spare capacity rather than against the code, so a busy
 * workstation reports contention as a failure.
 */
const CONTAINER_ROUND_TRIPS = 60_000;

type Learner = { name: string; email: string; password: string };

describe.skipIf(!DOCKER_AVAILABLE)(
  "createAuth (integration)",
  { timeout: CONTAINER_ROUND_TRIPS },
  () => {
    let libsql: StartedLibsql;
    let mailpit: StartedMailpit;
    let siteverify: Server;
    let auth: Auth;

    beforeAll(async () => {
      [libsql, mailpit, siteverify] = await Promise.all([
        startLibsqlContainer(),
        startMailpitContainer(),
        startSiteverifyStub(),
      ]);
      auth = buildAuth({ rateLimited: false });
    }, 240_000);

    afterAll(async () => {
      await Promise.all([libsql?.stop(), mailpit?.stop()]);
      siteverify?.close();
    });

    function buildAuth({ rateLimited }: { rateLimited: boolean }): Auth {
      return createAuth({
        database: libsql.database,
        emailSender: new SmtpEmailSender({
          host: mailpit.smtpHost,
          port: mailpit.smtpPort,
          secure: false,
          from: "English Course <no-reply@english-course.online>",
        }),
        secret: "x".repeat(32),
        baseURL: BASE_URL,
        google: { clientId: "google-client-id", clientSecret: "google-client-secret" },
        captcha: {
          secretKey: "turnstile-secret",
          siteVerifyUrl: `http://127.0.0.1:${(siteverify.address() as AddressInfo).port}`,
        },
        rateLimited,
      });
    }

    function post(
      path: string,
      body: unknown,
      init: { cookie?: string; token?: string | null; locale?: string } = {},
    ) {
      const headers = new Headers({ "content-type": "application/json", origin: BASE_URL });
      if (init.token !== null) headers.set("x-captcha-response", init.token ?? PASSING_TOKEN);
      if (init.cookie) headers.set("cookie", init.cookie);
      if (init.locale) headers.set("x-app-locale", init.locale);
      return auth.handler(
        new Request(`${BASE_URL}/api/auth${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }),
      );
    }

    function get(url: string, cookie?: string) {
      const headers = new Headers({ origin: BASE_URL });
      if (cookie) headers.set("cookie", cookie);
      return auth.handler(new Request(url, { headers, redirect: "manual" }));
    }

    function aLearner(): Learner {
      return {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.internet.password({ length: 12 }),
      };
    }

    function signUp(learner: Learner, callbackURL = "/en/learning") {
      return post("/sign-up/email", { ...learner, callbackURL });
    }

    function signIn(learner: Pick<Learner, "email" | "password">, token?: string | null) {
      return post(
        "/sign-in/email",
        { email: learner.email, password: learner.password },
        { token },
      );
    }

    async function linkFromLatestEmail(address: string): Promise<string> {
      const message = await mailpit.latestMessageTo(address);
      const link = message.text.match(/https?:\/\/\S+\/api\/auth\/\S+/)?.[0];
      if (!link) throw new Error(`No auth link in the email to ${address}`);
      return link;
    }

    async function verifiedLearner(): Promise<Learner> {
      const learner = aLearner();
      await signUp(learner);
      await get(await linkFromLatestEmail(learner.email));
      return learner;
    }

    function sessionCookie(response: Response): string {
      return response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
    }

    async function sessionOf(cookie: string) {
      const response = await get(`${BASE_URL}/api/auth/get-session`, cookie);
      return (await response.json()) as { user: { id: string; email: string } } | null;
    }

    async function signedInLearner() {
      const learner = await verifiedLearner();
      const cookie = sessionCookie(await signIn(learner));
      const id = (await sessionOf(cookie))!.user.id;
      return { ...learner, id, cookie };
    }

    async function requestDeletion(cookie: string, callbackURL = "/en/account-deleted") {
      return post("/delete-user", { callbackURL }, { cookie, token: null });
    }

    async function seedEveryLearnerTable(userId: string) {
      for (const table of LEARNER_TABLES) {
        await libsql.database.insert(table).values(learnerRowFor(table, userId));
      }
    }

    async function rowsOwnedBy(userId: string) {
      const owned = [...LEARNER_TABLES, session, account].map((table) =>
        libsql.database.select().from(table).where(eq(table.userId, userId)),
      );
      const counts = await Promise.all(owned.map(async (rows) => (await rows).length));
      const users = await libsql.database.select().from(user).where(eq(user.id, userId));
      return counts.reduce((total, count) => total + count, users.length);
    }

    test("signing up sends a verification email in the locale of the callback", async () => {
      const learner = aLearner();

      const response = await signUp(learner, "/pt/learning");

      expect(response.status).toBe(200);
      const email = await mailpit.latestMessageTo(learner.email);
      expect(email.subject).toBe(pt.Emails.VerifyEmail.subject);
    });

    test("signing up with a taken address answers exactly like a new one", async () => {
      const learner = await verifiedLearner();

      const response = await signUp({ ...aLearner(), email: learner.email });

      expect(response.status).toBe(200);
    });

    test("an unverified learner cannot sign in", async () => {
      const learner = aLearner();
      await signUp(learner);

      const response = await signIn(learner);

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
    });

    test("following the verification link verifies, signs in and returns to the callback", async () => {
      const learner = aLearner();
      await signUp(learner, "/es/learning");

      const response = await get(await linkFromLatestEmail(learner.email));

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/es/learning");
      expect((await sessionOf(sessionCookie(response)))?.user.email).toBe(learner.email);
    });

    test("a wrong password and an unknown address fail the same way", async () => {
      const learner = await verifiedLearner();

      const wrongPassword = await signIn({ ...learner, password: "not-the-password" });
      const unknownAddress = await signIn(aLearner());

      expect(wrongPassword.status).toBe(unknownAddress.status);
      expect(await wrongPassword.json()).toEqual(await unknownAddress.json());
    });

    test("a reset replaces the password and revokes the other sessions", async () => {
      const learner = await verifiedLearner();
      const earlierSession = sessionCookie(await signIn(learner));
      await post("/request-password-reset", {
        email: learner.email,
        redirectTo: "/es/reset-password",
      });
      const email = await mailpit.latestMessageTo(learner.email);
      expect(email.subject).toBe(es.Emails.ResetPassword.subject);
      const token = new URL(await linkFromLatestEmail(learner.email)).pathname.split("/").at(-1);
      const newPassword = faker.internet.password({ length: 14 });

      const reset = await post("/reset-password", { newPassword, token });

      expect(reset.status).toBe(200);
      expect((await signIn({ ...learner, password: newPassword })).status).toBe(200);
      expect((await signIn(learner)).status).toBe(401);
      expect(await sessionOf(earlierSession)).toBeNull();
      const reused = await post("/reset-password", { newPassword: "another-password-1", token });
      expect(reused.status).toBe(400);
      expect(await reused.json()).toMatchObject({ code: "INVALID_TOKEN" });
    });

    test("a sign-in without a captcha token is refused", async () => {
      const learner = await verifiedLearner();

      const response = await signIn(learner, null);

      expect(response.status).toBe(400);
      expect(sessionCookie(response)).toBe("");
    });

    test("a sign-in whose captcha token fails verification is refused", async () => {
      const learner = await verifiedLearner();

      const response = await signIn(learner, "fail");

      expect(response.status).toBe(403);
    });

    test("Google may link to an existing account with the same address", () => {
      expect(auth.options.account?.accountLinking).toMatchObject({
        enabled: true,
        trustedProviders: ["google"],
      });
    });

    test("asking to delete the account emails a confirmation link in the locale of the callback", async () => {
      const learner = await signedInLearner();

      const response = await requestDeletion(learner.cookie, "/es/account-deleted");

      expect(response.status).toBe(200);
      const email = await mailpit.latestMessageTo(learner.email);
      expect(email.subject).toBe(es.Emails.DeleteAccount.subject);
      expect(await rowsOwnedBy(learner.id)).toBeGreaterThan(0);
    });

    test("the deletion link opened without the account's session deletes nothing", async () => {
      const learner = await signedInLearner();
      const someoneElse = await signedInLearner();
      await requestDeletion(learner.cookie);
      const link = await linkFromLatestEmail(learner.email);

      const anonymous = await get(link);
      const otherAccount = await get(link, someoneElse.cookie);

      expect(anonymous.status).not.toBe(302);
      expect(otherAccount.status).not.toBe(302);
      expect(await sessionOf(learner.cookie)).not.toBeNull();
      expect((await sessionOf(someoneElse.cookie))?.user.email).toBe(someoneElse.email);
    });

    test("the deletion link opened in the account's session deletes the user and everything it owns", async () => {
      const learner = await signedInLearner();
      await seedEveryLearnerTable(learner.id);
      await requestDeletion(learner.cookie);

      const response = await get(await linkFromLatestEmail(learner.email), learner.cookie);

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/en/account-deleted");
      expect(await rowsOwnedBy(learner.id)).toBe(0);
      expect((await signIn(learner)).status).toBe(401);
    });

    test("changing the password keeps this session, revokes the others and replaces the password", async () => {
      const learner = await signedInLearner();
      const otherDevice = sessionCookie(await signIn(learner));
      const newPassword = faker.internet.password({ length: 14 });

      const response = await post(
        "/change-password",
        { currentPassword: learner.password, newPassword, revokeOtherSessions: true },
        { cookie: learner.cookie, token: null },
      );

      expect(response.status).toBe(200);
      expect((await sessionOf(sessionCookie(response)))?.user.email).toBe(learner.email);
      expect(await sessionOf(otherDevice)).toBeNull();
      expect((await signIn({ ...learner, password: newPassword })).status).toBe(200);
      expect((await signIn(learner)).status).toBe(401);
    });

    test("changing the password with the wrong current one is refused by code", async () => {
      const learner = await signedInLearner();

      const response = await post(
        "/change-password",
        {
          currentPassword: "not-the-password",
          newPassword: faker.internet.password({ length: 14 }),
          revokeOtherSessions: true,
        },
        { cookie: learner.cookie, token: null },
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "INVALID_PASSWORD" });
      expect((await signIn(learner)).status).toBe(200);
    });

    test("changing the address asks the address on file first and moves nothing yet", async () => {
      const learner = await signedInLearner();
      const newEmail = faker.internet.email().toLowerCase();

      const response = await post(
        "/change-email",
        { newEmail, callbackURL: "/es/profile" },
        { cookie: learner.cookie, token: null },
      );

      expect(response.status).toBe(200);
      const approval = await mailpit.latestMessageTo(learner.email);
      expect(approval.subject).toBe(es.Emails.ChangeEmail.subject);
      expect(approval.text).toContain(newEmail);
      expect((await sessionOf(learner.cookie))?.user.email).toBe(learner.email);
    });

    test("the address moves only after the approval and the verification are both opened", async () => {
      const learner = await signedInLearner();
      const newEmail = faker.internet.email().toLowerCase();
      await post(
        "/change-email",
        { newEmail, callbackURL: "/es/profile" },
        { cookie: learner.cookie, token: null },
      );

      const approved = await get(await linkFromLatestEmail(learner.email), learner.cookie);

      expect(approved.status).toBe(302);
      expect((await mailpit.latestMessageTo(newEmail)).subject).toBe(es.Emails.VerifyEmail.subject);
      expect((await sessionOf(learner.cookie))?.user.email).toBe(learner.email);

      const moved = await get(await linkFromLatestEmail(newEmail), learner.cookie);

      expect(moved.status).toBe(302);
      expect((await signIn({ ...learner, email: newEmail })).status).toBe(200);
      expect((await signIn(learner)).status).toBe(401);
    });

    test("asking to move to an address that is taken answers the same and mails nobody", async () => {
      const learner = await signedInLearner();
      const someoneElse = await verifiedLearner();

      const response = await post(
        "/change-email",
        { newEmail: someoneElse.email, callbackURL: "/en/profile" },
        { cookie: learner.cookie, token: null },
      );

      expect(response.status).toBe(200);
      expect((await mailpit.latestMessageTo(someoneElse.email)).subject).not.toBe(
        es.Emails.ChangeEmail.subject,
      );
    });

    /** Polls, because the notices are sent without blocking the answer. */
    async function latestSubjectTo(address: string): Promise<string> {
      return (await mailpit.latestMessageTo(address)).subject;
    }

    test("a completed password change notifies the account in the locale it was made in", async () => {
      const learner = await signedInLearner();

      await post(
        "/change-password",
        {
          currentPassword: learner.password,
          newPassword: faker.internet.password({ length: 14 }),
          revokeOtherSessions: true,
        },
        { cookie: learner.cookie, token: null, locale: "es" },
      );

      await expect
        .poll(() => latestSubjectTo(learner.email))
        .toBe(es.Emails.PasswordChanged.subject);
      const notice = await mailpit.latestMessageTo(learner.email);
      expect(notice.text).toContain("/es/forgot-password");
      expect(notice.text).not.toContain("token=");
    });

    test("a password change refused for the wrong current password notifies nobody", async () => {
      // Otherwise a stolen session could bury the real notice under its own noise.
      const learner = await signedInLearner();
      const before = await latestSubjectTo(learner.email);

      const response = await post(
        "/change-password",
        {
          currentPassword: "not-the-password",
          newPassword: faker.internet.password({ length: 14 }),
          revokeOtherSessions: true,
        },
        { cookie: learner.cookie, token: null, locale: "es" },
      );

      expect(response.status).toBe(400);
      await expect(latestSubjectTo(learner.email)).resolves.toBe(before);
    });

    test("a completed reset notifies the account too", async () => {
      const learner = await verifiedLearner();
      await post("/request-password-reset", {
        email: learner.email,
        redirectTo: "/pt/reset-password",
      });
      const token = new URL(await linkFromLatestEmail(learner.email)).pathname.split("/").at(-1);

      const reset = await post(
        "/reset-password",
        { newPassword: faker.internet.password({ length: 14 }), token },
        { locale: "pt" },
      );

      expect(reset.status).toBe(200);
      await expect
        .poll(() => latestSubjectTo(learner.email))
        .toBe(pt.Emails.PasswordChanged.subject);
    });

    test("replaying a spent reset token notifies nobody a second time", async () => {
      const learner = await verifiedLearner();
      await post("/request-password-reset", {
        email: learner.email,
        redirectTo: "/en/reset-password",
      });
      const token = new URL(await linkFromLatestEmail(learner.email)).pathname.split("/").at(-1);
      await post("/reset-password", { newPassword: "first-new-password", token });
      await expect
        .poll(() => latestSubjectTo(learner.email))
        .toBe(en.Emails.PasswordChanged.subject);
      const messagesBefore = await mailpit.latestMessageTo(learner.email);

      const replay = await post("/reset-password", { newPassword: "second-new-password", token });

      expect(replay.status).toBe(400);
      await expect(mailpit.latestMessageTo(learner.email)).resolves.toMatchObject({
        subject: messagesBefore.subject,
      });
    });

    test("when rate limiting is on, bursts of sign-ins are refused and counted in the database", async () => {
      const limited = buildAuth({ rateLimited: true });
      const learner = aLearner();
      const attempt = () =>
        limited.handler(
          new Request(`${BASE_URL}/api/auth/sign-in/email`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: BASE_URL,
              "x-captcha-response": PASSING_TOKEN,
              "x-forwarded-for": "203.0.113.7",
            },
            body: JSON.stringify({ email: learner.email, password: learner.password }),
          }),
        );

      const statuses: number[] = [];
      for (let index = 0; index < 5; index++) statuses.push((await attempt()).status);

      expect(statuses).toContain(429);
      const counters = await libsql.database.select().from(rateLimit);
      expect(counters.length).toBeGreaterThan(0);
    });
  },
);

type LearnerRow = { userId: string } & Record<string, unknown>;

const LEARNER_ROWS = new Map<SQLiteTable, (userId: string) => LearnerRow>([
  [learnerProfile, (userId) => ({ userId, name: "Ada", avatarKind: "initials" })],
  [lessonCompletion, (userId) => ({ userId, lessonId: "lesson-1" })],
  [playbackPosition, (userId) => ({ userId, lessonId: "lesson-1", seconds: 42 })],
  [
    continueWatching,
    (userId) => ({ userId, courseSlug: "course", moduleSlug: "module", lessonId: "lesson-1" }),
  ],
  [earnedTicket, (userId) => ({ userId, lessonId: "lesson-1" })],
  [prizeClaim, (userId) => ({ userId, moduleSlug: "module" })],
]);

// A learner table added without a row here fails loudly, so the deletion test
// can never silently skip a table.
function learnerRowFor(table: SQLiteTable, userId: string): LearnerRow {
  const row = LEARNER_ROWS.get(table);
  if (!row) throw new Error("A learner table has no seed row in this suite");
  return row(userId);
}

function startSiteverifyStub(): Promise<Server> {
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      const { response: token } = JSON.parse(body) as { response: string };
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ success: token === PASSING_TOKEN, hostname: "localhost" }));
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}
