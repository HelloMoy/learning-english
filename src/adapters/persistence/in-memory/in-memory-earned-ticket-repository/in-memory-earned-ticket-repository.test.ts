import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { InMemoryEarnedTicketRepository } from "./in-memory-earned-ticket-repository";

const aLesson = () => LessonId.parse(faker.string.uuid());

describe("InMemoryEarnedTicketRepository", () => {
  test("WHEN nothing has been earned THEN the set is empty", async () => {
    expect((await new InMemoryEarnedTicketRepository().list()).size).toBe(0);
  });

  test("WHEN batches overlap THEN each lesson is held once", async () => {
    const [a, b, c] = [aLesson(), aLesson(), aLesson()];
    const tickets = new InMemoryEarnedTicketRepository();

    await tickets.earn([a, b]);
    await tickets.earn([b, c]);

    expect(await tickets.list()).toEqual(new Set([a, b, c]));
  });

  test("WHEN seeded THEN those tickets are held", async () => {
    const lesson = aLesson();

    expect(await new InMemoryEarnedTicketRepository([lesson]).list()).toEqual(new Set([lesson]));
  });
});
