/**
 * Storybook stories for the `DropdownMenu` primitive.
 *
 * The primitive ships no copy of its own — every label here belongs to the
 * story, mirroring how a composing component supplies its own translated
 * strings.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Check } from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
];

/**
 * A single-choice menu — the only shape this primitive supports, and the one
 * the locale switcher composes.
 */
const SingleChoiceMenu = ({ defaultValue = "en" }: { defaultValue?: string }) => {
  const [value, setValue] = useState(defaultValue);
  const active = LANGUAGES.find((language) => language.value === value)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Language: ${active.label}`}
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-foreground/5 px-3 text-xs font-semibold text-foreground"
      >
        {active.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={setValue}
        >
          {LANGUAGES.map((language) => (
            <DropdownMenuRadioItem
              key={language.value}
              value={language.value}
            >
              <span className="inline-flex w-4 justify-center">
                <DropdownMenuItemIndicator>
                  <Check className="size-3.5" />
                </DropdownMenuItemIndicator>
              </span>
              {language.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const meta = {
  title: "UI/DropdownMenu",
  component: SingleChoiceMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SingleChoiceMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed. Click or press Enter to open; arrow keys move, Escape dismisses. */
export const Default: Story = {};

/** A different option checked, to see the indicator move. */
export const SecondOptionActive: Story = {
  args: { defaultValue: "es" },
};

/**
 * On a phone. The content is portalled, so the menu escapes the header's
 * `overflow-hidden` instead of being clipped by it.
 */
export const NarrowPhone: Story = {
  parameters: {
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};
