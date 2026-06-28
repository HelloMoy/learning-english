/**
 * Storybook stories for the shadcn/ui `Button` primitive.
 *
 * Demonstrates every CVA variant exposed by `buttonVariants`, an `AllSizes`
 * story that compares sizes side-by-side, and a destructive-action story.
 * All user-facing copy is sourced from `useTranslations` under the
 * `Stories.Button` namespace (located in `.storybook/messages/<locale>.json`)
 * so the stories automatically re-render in every supported locale when the
 * toolbar locale switcher is used.
 *
 * Conventions applied:
 *   - Story structure follows the `storybook-story-writing` skill
 *   - i18n strings go through `useTranslations` (no hardcoded user copy)
 *   - Each exported story has a JSDoc block describing what it shows
 *
 * Translation vs Faker:
 *   - DEFAULT — use translations under `Stories.*` for any string the
 *     reviewer reads. They are deterministic (the reviewer knows what to
 *     expect) and translated (the locale switcher works).
 *   - EXCEPTION — `@faker-js/faker` is allowed ONLY for generated sample
 *     DATA when determinism doesn't matter (a long list of fake users to
 *     fill a table, a stream of mock transactions, etc.). The data MUST
 *     always be internationalized — pick the faker instance that matches
 *     the locale currently selected in the Storybook toolbar:
 *
 *     ```ts
 *     import { getFakerIntl } from "../../../.storybook/utils/getFakerIntl";
 *
 *     function UserProfileStory(
 *       _args: unknown,
 *       context: { globals: { locale: "en" | "es" | "pt" } },
 *     ) {
 *       const fakerIntl = getFakerIntl(context.globals.locale);
 *       return (
 *         <UserProfile
 *           name={fakerIntl.person.fullName()}
 *           email={fakerIntl.internet.email()}
 *         />
 *       );
 *     }
 *     ```
 *
 *     NEVER default to `faker` (English) when the toolbar shows es or pt —
 *     that produces Spanish UI labels with English fake names, which
 *     defeats the point of the locale switcher.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { Button } from "./button";

// Each render is a named component (not an inline arrow) so ESLint's
// `react-hooks/rules-of-hooks` recognizes `useTranslations` as legal —
// `react-hooks/rules-of-hooks` only allows hooks inside functions whose
// names start with an uppercase letter (treating them as React components).
// Storybook invokes these `render` functions as components in its preview.

/** Default filled button — the most common usage. */
function DefaultStory() {
  const t = useTranslations("Stories.Button");
  return <Button>{t("clickMe")}</Button>;
}

/** Outlined variant — secondary visual weight, transparent background. */
function OutlineStory() {
  const t = useTranslations("Stories.Button");
  return <Button variant="outline">{t("clickMe")}</Button>;
}

/** Secondary variant — softer background than the default. */
function SecondaryStory() {
  const t = useTranslations("Stories.Button");
  return <Button variant="secondary">{t("clickMe")}</Button>;
}

/** Ghost variant — no background until hovered/focused. */
function GhostStory() {
  const t = useTranslations("Stories.Button");
  return <Button variant="ghost">{t("clickMe")}</Button>;
}

/** Destructive variant — used for irreversible actions like deletion. */
function DestructiveStory() {
  const t = useTranslations("Stories.Button");
  return <Button variant="destructive">{t("delete")}</Button>;
}

/** Link variant — renders as a text link, no background or border. */
function LinkStory() {
  const t = useTranslations("Stories.Button");
  return <Button variant="link">{t("learnMore")}</Button>;
}

/**
 * Visual comparison of every non-icon size (`xs`, `sm`, `default`, `lg`)
 * side-by-side. Icon sizes are excluded because they have no children.
 */
function AllSizesStory() {
  const t = useTranslations("Stories.Button");
  return (
    <div className="flex items-center gap-2">
      <Button size="xs">{t("sizeExtraSmall")}</Button>
      <Button size="sm">{t("sizeSmall")}</Button>
      <Button size="default">{t("sizeDefault")}</Button>
      <Button size="lg">{t("sizeLarge")}</Button>
    </div>
  );
}

/**
 * Default story configuration for the `Button` primitive.
 *
 * Every story renders its label via `useTranslations("Stories.Button")`
 * so the locale toolbar dropdown in Storybook re-renders the copy in
 * `en` / `es` / `pt` without touching the story file.
 */
const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "default", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    asChild: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: DefaultStory };
export const Outline: Story = { render: OutlineStory };
export const Secondary: Story = { render: SecondaryStory };
export const Ghost: Story = { render: GhostStory };
export const Destructive: Story = { render: DestructiveStory };
export const Link: Story = { render: LinkStory };
export const AllSizes: Story = { render: AllSizesStory };
