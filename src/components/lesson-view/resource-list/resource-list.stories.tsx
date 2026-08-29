import { Resource } from "@/domain/entities/resource/resource";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ResourceList } from "./resource-list";

const meta = {
  title: "LessonView/ResourceList",
  component: ResourceList,
} satisfies Meta<typeof ResourceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResources: Story = {
  args: {
    resources: [
      Resource.parse({
        id: faker.string.uuid(),
        lessonId: faker.string.uuid(),
        title: "Vowel chart",
        url: faker.internet.url(),
        kind: "pdf",
      }),
      Resource.parse({
        id: faker.string.uuid(),
        lessonId: faker.string.uuid(),
        title: "Drill slides",
        url: faker.internet.url(),
        kind: "slides",
      }),
    ],
  },
};

export const Empty: Story = {
  args: { resources: [] },
};
