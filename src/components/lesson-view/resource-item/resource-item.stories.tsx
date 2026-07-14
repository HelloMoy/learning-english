import { Resource } from "@/domain/entities/resource/resource";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { vi } from "vitest";

import { ResourceItem } from "./resource-item";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

void useTranslations;

const meta = {
  title: "LessonView/ResourceItem",
  component: ResourceItem,
} satisfies Meta<typeof ResourceItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const makeResource = (kind: "pdf" | "slides" | "code" | "other") =>
  Resource.parse({
    id: faker.string.uuid(),
    lessonId: faker.string.uuid(),
    title: `${kind.toUpperCase()} — ${faker.commerce.productName()}`,
    url: faker.internet.url(),
    kind,
  });

export const Pdf: Story = {
  args: { resource: makeResource("pdf") },
};

export const Slides: Story = {
  args: { resource: makeResource("slides") },
};

export const Code: Story = {
  args: { resource: makeResource("code") },
};

export const Other: Story = {
  args: { resource: makeResource("other") },
};
