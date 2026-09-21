import { LearnerCard } from "@/components/learner-card/learner-card";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { LearnerCardNameField } from "./learner-card-name-field";

/**
 * The field only makes sense where it lives: in the card's name line. Each
 * story renders it there, holding its own state so typing behaves as it does
 * in the onboarding.
 */
function NameFieldOnACard({ startsWith, autoFocus }: { startsWith: string; autoFocus?: boolean }) {
  const t = useTranslations("Stories.LearnerCardNameField");
  const [name, setName] = useState(startsWith);

  return (
    <LearnerCard
      name={name}
      avatar={{ kind: "initials" }}
      level={{ number: 1, courseTitle: "Basic Course" }}
      progress={{ completed: 0, total: 48 }}
      nameField={
        <LearnerCardNameField
          label={t("label")}
          placeholder={t("placeholder")}
          value={name}
          onChange={setName}
          autoFocus={autoFocus}
        />
      }
    />
  );
}

const meta = {
  title: "Components/LearnerCardNameField",
  component: LearnerCardNameField,
  // Every story renders the field inside a card that owns its state, so the
  // args exist only to satisfy the component's contract.
  args: { label: "Your name", placeholder: "Your name", value: "", onChange: () => {} },
  parameters: { controls: { disable: true } },
  decorators: [
    (Story) => (
      <div className="max-w-[440px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LearnerCardNameField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Onboarding step 1 for an account that carries no name: the placeholder stands in. */
export const Empty: Story = {
  render: () => <NameFieldOnACard startsWith="" />,
};

/** Step 1 for an account that has a name: the field opens with it, ready to confirm. */
export const Seeded: Story = {
  render: () => <NameFieldOnACard startsWith="Ana García" />,
};

/** The card follows the field as it is typed, initials included. */
export const Typing: Story = {
  render: () => <NameFieldOnACard startsWith="" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox");

    await userEvent.type(field, "Ana García");

    await expect(field).toHaveValue("Ana García");
    await expect(canvas.getByRole("img", { name: /Ana García/ })).toHaveTextContent("AG");
  },
};

/** Step 1 hands the field focus, so a learner can type without aiming at it. */
export const Focused: Story = {
  render: () => (
    <NameFieldOnACard
      startsWith=""
      autoFocus
    />
  ),
};
